import Foundation
import Capacitor
import Supabase

@objc(CapacitorSupabasePlugin)
public class CapacitorSupabasePlugin: CAPPlugin, CAPBridgedPlugin {
    private let pluginVersion: String = "8.0.5"
    public let identifier = "CapacitorSupabasePlugin"
    public let jsName = "CapacitorSupabase"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "initialize", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "signInWithPassword", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "signUp", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "signInAnonymously", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "signInWithOAuth", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "signInWithOtp", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "verifyOtp", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "signOut", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getSession", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "refreshSession", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getUser", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setSession", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "select", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "insert", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "delete", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPluginVersion", returnType: CAPPluginReturnPromise)
    ]

    private var supabaseClient: SupabaseClient?
    private var authStateTask: Task<Void, Never>?

    deinit {
        authStateTask?.cancel()
    }

    @objc func initialize(_ call: CAPPluginCall) {
        guard let supabaseUrl = call.getString("supabaseUrl"),
              let supabaseKey = call.getString("supabaseKey"),
              let url = URL(string: supabaseUrl) else {
            call.reject("Missing or invalid supabaseUrl or supabaseKey")
            return
        }

        supabaseClient = SupabaseClient(
            supabaseURL: url,
            supabaseKey: supabaseKey
        )

        setupAuthStateListener()
        call.resolve()
    }

    private func setupAuthStateListener() {
        authStateTask?.cancel()
        authStateTask = Task { [weak self] in
            guard let client = self?.supabaseClient else { return }
            for await (event, session) in client.auth.authStateChanges {
                guard !Task.isCancelled else { break }
                let eventName: String
                switch event {
                case .initialSession:
                    eventName = "INITIAL_SESSION"
                case .signedIn:
                    eventName = "SIGNED_IN"
                case .signedOut:
                    eventName = "SIGNED_OUT"
                case .tokenRefreshed:
                    eventName = "TOKEN_REFRESHED"
                case .userUpdated:
                    eventName = "USER_UPDATED"
                case .passwordRecovery:
                    eventName = "PASSWORD_RECOVERY"
                default:
                    continue
                }

                var data: [String: Any] = ["event": eventName]
                if let session = session {
                    data["session"] = self?.sessionToDict(session)
                } else {
                    data["session"] = NSNull()
                }

                self?.notifyListeners("authStateChange", data: data)
            }
        }
    }

    @objc func signInWithPassword(_ call: CAPPluginCall) {
        guard let client = supabaseClient else {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        guard let email = call.getString("email"),
              let password = call.getString("password") else {
            call.reject("Missing email or password")
            return
        }

        Task {
            do {
                let session = try await client.auth.signIn(email: email, password: password)
                call.resolve(authResultToDict(session: session, user: session.user))
            } catch {
                call.reject("Sign in failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func signUp(_ call: CAPPluginCall) {
        guard let client = supabaseClient else {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        guard let email = call.getString("email"),
              let password = call.getString("password") else {
            call.reject("Missing email or password")
            return
        }

        let userData = call.getObject("data")

        Task {
            do {
                let response: AuthResponse
                if let userData = userData {
                    let jsonData = try JSONSerialization.data(withJSONObject: userData)
                    let decodedData = try JSONDecoder().decode([String: AnyJSON].self, from: jsonData)
                    response = try await client.auth.signUp(email: email, password: password, data: decodedData)
                } else {
                    response = try await client.auth.signUp(email: email, password: password)
                }
                call.resolve(authResultToDict(session: response.session, user: response.user))
            } catch {
                call.reject("Sign up failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func signInAnonymously(_ call: CAPPluginCall) {
        guard let client = supabaseClient else {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        Task {
            do {
                let session = try await client.auth.signInAnonymously()
                call.resolve(authResultToDict(session: session, user: session.user))
            } catch {
                call.reject("Anonymous sign in failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func signInWithOAuth(_ call: CAPPluginCall) {
        guard let client = supabaseClient else {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        guard let providerString = call.getString("provider"),
              let provider = oauthProviderFromString(providerString) else {
            call.reject("Missing or invalid provider")
            return
        }

        let redirectTo = call.getString("redirectTo")
        let scopes = call.getString("scopes")

        Task {
            do {
                let url = try await client.auth.getOAuthSignInURL(
                    provider: provider,
                    scopes: scopes,
                    redirectTo: redirectTo.flatMap { URL(string: $0) }
                )
                await MainActor.run {
                    UIApplication.shared.open(url)
                }
                call.resolve()
            } catch {
                call.reject("OAuth sign in failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func signInWithOtp(_ call: CAPPluginCall) {
        guard let client = supabaseClient else {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        let email = call.getString("email")
        let phone = call.getString("phone")

        guard email != nil || phone != nil else {
            call.reject("Either email or phone is required")
            return
        }

        Task {
            do {
                if let email = email {
                    try await client.auth.signInWithOTP(email: email)
                } else if let phone = phone {
                    try await client.auth.signInWithOTP(phone: phone)
                }
                call.resolve()
            } catch {
                call.reject("OTP sign in failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func verifyOtp(_ call: CAPPluginCall) {
        guard let client = supabaseClient else {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        guard let token = call.getString("token"),
              let typeString = call.getString("type") else {
            call.reject("Missing token or type")
            return
        }

        let email = call.getString("email")
        let phone = call.getString("phone")

        guard email != nil || phone != nil else {
            call.reject("Either email or phone is required")
            return
        }

        Task {
            do {
                let response: AuthResponse
                if let email = email {
                    let type = emailOtpTypeFromString(typeString)
                    response = try await client.auth.verifyOTP(email: email, token: token, type: type)
                } else if let phone = phone {
                    let type = phoneOtpTypeFromString(typeString)
                    response = try await client.auth.verifyOTP(phone: phone, token: token, type: type)
                } else {
                    call.reject("Either email or phone is required")
                    return
                }
                call.resolve(authResultToDict(session: response.session, user: response.user))
            } catch {
                call.reject("OTP verification failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func signOut(_ call: CAPPluginCall) {
        guard let client = supabaseClient else {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        Task {
            do {
                try await client.auth.signOut()
                call.resolve()
            } catch {
                call.reject("Sign out failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func getSession(_ call: CAPPluginCall) {
        guard let client = supabaseClient else {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        Task {
            do {
                let session = try await client.auth.session
                call.resolve(["session": sessionToDict(session)])
            } catch {
                call.resolve(["session": NSNull()])
            }
        }
    }

    @objc func refreshSession(_ call: CAPPluginCall) {
        guard let client = supabaseClient else {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        Task {
            do {
                let session = try await client.auth.refreshSession()
                call.resolve(["session": sessionToDict(session)])
            } catch {
                call.reject("Session refresh failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func getUser(_ call: CAPPluginCall) {
        guard let client = supabaseClient else {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        Task {
            do {
                let user = try await client.auth.user()
                call.resolve(["user": userToDict(user)])
            } catch {
                call.resolve(["user": NSNull()])
            }
        }
    }

    @objc func setSession(_ call: CAPPluginCall) {
        guard let client = supabaseClient else {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        guard let accessToken = call.getString("accessToken"),
              let refreshToken = call.getString("refreshToken") else {
            call.reject("Missing accessToken or refreshToken")
            return
        }

        Task {
            do {
                let session = try await client.auth.setSession(accessToken: accessToken, refreshToken: refreshToken)
                call.resolve(["session": sessionToDict(session)])
            } catch {
                call.reject("Set session failed: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Database Operations

    @objc func select(_ call: CAPPluginCall) {
        guard let client = supabaseClient else {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        guard let table = call.getString("table") else {
            call.reject("Missing table name")
            return
        }

        let columns = call.getString("columns") ?? "*"
        let filter = call.getObject("filter")
        let limit = call.getInt("limit")
        let offset = call.getInt("offset")
        let orderBy = call.getString("orderBy")
        let ascending = call.getBool("ascending") ?? true
        let single = call.getBool("single") ?? false

        Task {
            do {
                var filterQuery = client.from(table).select(columns)

                if let filter = filter {
                    for (key, value) in filter {
                        if let stringValue = value as? String {
                            filterQuery = filterQuery.eq(key, value: stringValue)
                        } else if let intValue = value as? Int {
                            filterQuery = filterQuery.eq(key, value: intValue)
                        } else if let doubleValue = value as? Double {
                            filterQuery = filterQuery.eq(key, value: doubleValue)
                        } else if let boolValue = value as? Bool {
                            filterQuery = filterQuery.eq(key, value: boolValue)
                        }
                    }
                }

                var transformQuery = filterQuery.order(orderBy ?? "id", ascending: ascending)

                if let limit = limit {
                    transformQuery = transformQuery.limit(limit)
                }

                if let offset = offset {
                    transformQuery = transformQuery.range(from: offset, to: offset + (limit ?? 1000) - 1)
                }

                if single {
                    let result: [String: AnyJSON] = try await transformQuery.single().execute().value
                    let jsonData = try JSONEncoder().encode(result)
                    let dict = try JSONSerialization.jsonObject(with: jsonData)
                    call.resolve(["data": dict, "error": NSNull()])
                } else {
                    let result: [[String: AnyJSON]] = try await transformQuery.execute().value
                    let jsonData = try JSONEncoder().encode(result)
                    let array = try JSONSerialization.jsonObject(with: jsonData)
                    call.resolve(["data": array, "error": NSNull()])
                }
            } catch {
                call.resolve(["data": NSNull(), "error": error.localizedDescription])
            }
        }
    }

    @objc func insert(_ call: CAPPluginCall) {
        guard let client = supabaseClient else {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        guard let table = call.getString("table") else {
            call.reject("Missing table name")
            return
        }

        guard let values = call.getObject("values") else {
            call.reject("Missing values to insert")
            return
        }

        Task {
            do {
                let jsonData = try JSONSerialization.data(withJSONObject: values)
                let decodedValues = try JSONDecoder().decode([String: AnyJSON].self, from: jsonData)
                let result: [String: AnyJSON] = try await client.from(table)
                    .insert(decodedValues)
                    .select()
                    .single()
                    .execute()
                    .value
                let resultData = try JSONEncoder().encode(result)
                let dict = try JSONSerialization.jsonObject(with: resultData)
                call.resolve(["data": dict, "error": NSNull()])
            } catch {
                call.resolve(["data": NSNull(), "error": error.localizedDescription])
            }
        }
    }

    @objc func update(_ call: CAPPluginCall) {
        guard let client = supabaseClient else {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        guard let table = call.getString("table") else {
            call.reject("Missing table name")
            return
        }

        guard let values = call.getObject("values") else {
            call.reject("Missing values to update")
            return
        }

        guard let filter = call.getObject("filter"), !filter.isEmpty else {
            call.reject("Missing filter for update operation")
            return
        }

        Task {
            do {
                let jsonData = try JSONSerialization.data(withJSONObject: values)
                let decodedValues = try JSONDecoder().decode([String: AnyJSON].self, from: jsonData)
                var query = try client.from(table).update(decodedValues)

                for (key, value) in filter {
                    if let stringValue = value as? String {
                        query = query.eq(key, value: stringValue)
                    } else if let intValue = value as? Int {
                        query = query.eq(key, value: intValue)
                    } else if let doubleValue = value as? Double {
                        query = query.eq(key, value: doubleValue)
                    } else if let boolValue = value as? Bool {
                        query = query.eq(key, value: boolValue)
                    }
                }

                let result: [[String: AnyJSON]] = try await query.select().execute().value
                let resultData = try JSONEncoder().encode(result)
                let array = try JSONSerialization.jsonObject(with: resultData)
                call.resolve(["data": array, "error": NSNull()])
            } catch {
                call.resolve(["data": NSNull(), "error": error.localizedDescription])
            }
        }
    }

    @objc func delete(_ call: CAPPluginCall) {
        guard let client = supabaseClient else {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        guard let table = call.getString("table") else {
            call.reject("Missing table name")
            return
        }

        guard let filter = call.getObject("filter"), !filter.isEmpty else {
            call.reject("Missing filter for delete operation")
            return
        }

        Task {
            do {
                var query = try client.from(table).delete()

                for (key, value) in filter {
                    if let stringValue = value as? String {
                        query = query.eq(key, value: stringValue)
                    } else if let intValue = value as? Int {
                        query = query.eq(key, value: intValue)
                    } else if let doubleValue = value as? Double {
                        query = query.eq(key, value: doubleValue)
                    } else if let boolValue = value as? Bool {
                        query = query.eq(key, value: boolValue)
                    }
                }

                let result: [[String: AnyJSON]] = try await query.select().execute().value
                let resultData = try JSONEncoder().encode(result)
                let array = try JSONSerialization.jsonObject(with: resultData)
                call.resolve(["data": array, "error": NSNull()])
            } catch {
                call.resolve(["data": NSNull(), "error": error.localizedDescription])
            }
        }
    }

    @objc func getPluginVersion(_ call: CAPPluginCall) {
        call.resolve(["version": self.pluginVersion])
    }

    // MARK: - Helper Methods

    private func sessionToDict(_ session: Session) -> [String: Any] {
        return [
            "accessToken": session.accessToken,
            "refreshToken": session.refreshToken,
            "tokenType": session.tokenType,
            "expiresIn": session.expiresIn,
            "expiresAt": session.expiresAt,
            "user": userToDict(session.user)
        ]
    }

    private func userToDict(_ user: User) -> [String: Any] {
        var dict: [String: Any] = [
            "id": user.id.uuidString,
            "createdAt": ISO8601DateFormatter().string(from: user.createdAt)
        ]

        if let email = user.email {
            dict["email"] = email
        }

        if let phone = user.phone {
            dict["phone"] = phone
        }

        if let lastSignInAt = user.lastSignInAt {
            dict["lastSignInAt"] = ISO8601DateFormatter().string(from: lastSignInAt)
        }

        let userMetadata = user.userMetadata
        if let data = try? JSONEncoder().encode(userMetadata),
           let dict2 = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            dict["userMetadata"] = dict2
        }

        let appMetadata = user.appMetadata
        if let data = try? JSONEncoder().encode(appMetadata),
           let dict2 = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            dict["appMetadata"] = dict2
        }

        return dict
    }

    private func authResultToDict(session: Session?, user: User?) -> [String: Any] {
        var result: [String: Any] = [:]
        if let session = session {
            result["session"] = sessionToDict(session)
        } else {
            result["session"] = NSNull()
        }
        if let user = user {
            result["user"] = userToDict(user)
        } else {
            result["user"] = NSNull()
        }
        return result
    }

    private func oauthProviderFromString(_ provider: String) -> Provider? {
        switch provider.lowercased() {
        case "apple": return .apple
        case "azure": return .azure
        case "bitbucket": return .bitbucket
        case "discord": return .discord
        case "facebook": return .facebook
        case "figma": return .figma
        case "github": return .github
        case "gitlab": return .gitlab
        case "google": return .google
        case "kakao": return .kakao
        case "keycloak": return .keycloak
        case "linkedin": return .linkedin
        case "linkedin_oidc": return .linkedinOIDC
        case "notion": return .notion
        case "slack": return .slack
        case "slack_oidc": return .slackOIDC
        case "spotify": return .spotify
        case "twitch": return .twitch
        case "twitter": return .twitter
        case "workos": return .workos
        case "zoom": return .zoom
        default: return nil
        }
    }

    private func emailOtpTypeFromString(_ type: String) -> EmailOTPType {
        switch type.lowercased() {
        case "signup": return .signup
        case "magiclink": return .magiclink
        case "recovery": return .recovery
        case "email": return .email
        default: return .email
        }
    }

    private func phoneOtpTypeFromString(_ type: String) -> MobileOTPType {
        switch type.lowercased() {
        case "sms": return .sms
        default: return .sms
        }
    }
}
