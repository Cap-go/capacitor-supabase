package ee.forgr.plugin.capacitor_supabase

import android.content.Intent
import android.net.Uri
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.providers.builtin.OTP
import io.github.jan.supabase.auth.status.SessionStatus
import io.github.jan.supabase.auth.user.UserSession
import io.github.jan.supabase.auth.user.UserInfo
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import org.json.JSONArray
import org.json.JSONObject

@CapacitorPlugin(name = "CapacitorSupabase")
class CapacitorSupabasePlugin : Plugin() {
    private val pluginVersion = "7.0.0"
    private var supabaseClient: SupabaseClient? = null
    private val scope = CoroutineScope(Dispatchers.Main + Job())
    private var authStateJob: Job? = null

    override fun handleOnDestroy() {
        authStateJob?.cancel()
        scope.cancel()
        super.handleOnDestroy()
    }

    @PluginMethod
    fun initialize(call: PluginCall) {
        val supabaseUrl = call.getString("supabaseUrl")
        val supabaseKey = call.getString("supabaseKey")

        if (supabaseUrl.isNullOrEmpty() || supabaseKey.isNullOrEmpty()) {
            call.reject("Missing supabaseUrl or supabaseKey")
            return
        }

        try {
            supabaseClient = createSupabaseClient(
                supabaseUrl = supabaseUrl,
                supabaseKey = supabaseKey
            ) {
                install(Auth)
                install(Postgrest)
            }

            setupAuthStateListener()
            call.resolve()
        } catch (e: Exception) {
            call.reject("Failed to initialize Supabase client: ${e.message}")
        }
    }

    private fun setupAuthStateListener() {
        authStateJob?.cancel()
        authStateJob = scope.launch {
            supabaseClient?.auth?.sessionStatus?.collect { status ->
                val eventName = when (status) {
                    is SessionStatus.Authenticated -> "SIGNED_IN"
                    is SessionStatus.NotAuthenticated -> "SIGNED_OUT"
                    is SessionStatus.RefreshFailure -> "TOKEN_REFRESHED"
                    SessionStatus.Initializing -> "INITIAL_SESSION"
                    else -> return@collect
                }

                val data = JSObject()
                data.put("event", eventName)

                when (status) {
                    is SessionStatus.Authenticated -> {
                        data.put("session", sessionToJSObject(status.session))
                    }
                    else -> {
                        data.put("session", JSONObject.NULL)
                    }
                }

                notifyListeners("authStateChange", data)
            }
        }
    }

    @PluginMethod
    fun signInWithPassword(call: PluginCall) {
        val client = supabaseClient
        if (client == null) {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        val emailStr = call.getString("email")
        val passwordStr = call.getString("password")

        if (emailStr.isNullOrEmpty() || passwordStr.isNullOrEmpty()) {
            call.reject("Missing email or password")
            return
        }

        scope.launch {
            try {
                client.auth.signInWith(Email) {
                    email = emailStr
                    password = passwordStr
                }

                val session = client.auth.currentSessionOrNull()
                val user = client.auth.currentUserOrNull()

                val result = JSObject()
                result.put("session", session?.let { sessionToJSObject(it) } ?: JSONObject.NULL)
                result.put("user", user?.let { userToJSObject(it) } ?: JSONObject.NULL)
                call.resolve(result)
            } catch (e: Exception) {
                call.reject("Sign in failed: ${e.message}")
            }
        }
    }

    @PluginMethod
    fun signUp(call: PluginCall) {
        val client = supabaseClient
        if (client == null) {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        val emailStr = call.getString("email")
        val passwordStr = call.getString("password")
        val userData = call.getObject("data")

        if (emailStr.isNullOrEmpty() || passwordStr.isNullOrEmpty()) {
            call.reject("Missing email or password")
            return
        }

        scope.launch {
            try {
                val jsonData = userData?.let { jsObjectToJsonObject(it) }

                client.auth.signUpWith(Email) {
                    email = emailStr
                    password = passwordStr
                    if (jsonData != null) {
                        data = jsonData
                    }
                }

                val session = client.auth.currentSessionOrNull()
                val user = client.auth.currentUserOrNull()

                val result = JSObject()
                result.put("session", session?.let { sessionToJSObject(it) } ?: JSONObject.NULL)
                result.put("user", user?.let { userToJSObject(it) } ?: JSONObject.NULL)
                call.resolve(result)
            } catch (e: Exception) {
                call.reject("Sign up failed: ${e.message}")
            }
        }
    }

    @PluginMethod
    fun signInWithOAuth(call: PluginCall) {
        val client = supabaseClient
        if (client == null) {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        val providerString = call.getString("provider")
        val redirectTo = call.getString("redirectTo")

        if (providerString.isNullOrEmpty()) {
            call.reject("Missing provider")
            return
        }

        scope.launch {
            try {
                val provider = getOAuthProvider(providerString)
                if (provider == null) {
                    call.reject("Invalid OAuth provider: $providerString")
                    return@launch
                }

                val url = client.auth.getOAuthUrl(provider)

                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                activity.startActivity(intent)
                call.resolve()
            } catch (e: Exception) {
                call.reject("OAuth sign in failed: ${e.message}")
            }
        }
    }

    @PluginMethod
    fun signInWithOtp(call: PluginCall) {
        val client = supabaseClient
        if (client == null) {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        val emailStr = call.getString("email")
        val phoneStr = call.getString("phone")

        if (emailStr.isNullOrEmpty() && phoneStr.isNullOrEmpty()) {
            call.reject("Either email or phone is required")
            return
        }

        scope.launch {
            try {
                if (!emailStr.isNullOrEmpty()) {
                    client.auth.signInWith(OTP) {
                        email = emailStr
                    }
                } else if (!phoneStr.isNullOrEmpty()) {
                    client.auth.signInWith(OTP) {
                        phone = phoneStr
                    }
                }
                call.resolve()
            } catch (e: Exception) {
                call.reject("OTP sign in failed: ${e.message}")
            }
        }
    }

    @PluginMethod
    fun verifyOtp(call: PluginCall) {
        val client = supabaseClient
        if (client == null) {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        val emailStr = call.getString("email")
        val phoneStr = call.getString("phone")
        val token = call.getString("token")
        val type = call.getString("type")

        if (token.isNullOrEmpty()) {
            call.reject("Missing token")
            return
        }

        if (emailStr.isNullOrEmpty() && phoneStr.isNullOrEmpty()) {
            call.reject("Either email or phone is required")
            return
        }

        scope.launch {
            try {
                if (!emailStr.isNullOrEmpty()) {
                    client.auth.verifyEmailOtp(
                        type = getEmailOtpType(type ?: "email"),
                        email = emailStr,
                        token = token
                    )
                } else if (!phoneStr.isNullOrEmpty()) {
                    client.auth.verifyPhoneOtp(
                        type = getPhoneOtpType(type ?: "sms"),
                        phone = phoneStr,
                        token = token
                    )
                }

                val session = client.auth.currentSessionOrNull()
                val user = client.auth.currentUserOrNull()

                val result = JSObject()
                result.put("session", session?.let { sessionToJSObject(it) } ?: JSONObject.NULL)
                result.put("user", user?.let { userToJSObject(it) } ?: JSONObject.NULL)
                call.resolve(result)
            } catch (e: Exception) {
                call.reject("OTP verification failed: ${e.message}")
            }
        }
    }

    @PluginMethod
    fun signOut(call: PluginCall) {
        val client = supabaseClient
        if (client == null) {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        scope.launch {
            try {
                client.auth.signOut()
                call.resolve()
            } catch (e: Exception) {
                call.reject("Sign out failed: ${e.message}")
            }
        }
    }

    @PluginMethod
    fun getSession(call: PluginCall) {
        val client = supabaseClient
        if (client == null) {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        scope.launch {
            try {
                val session = client.auth.currentSessionOrNull()
                val result = JSObject()
                result.put("session", session?.let { sessionToJSObject(it) } ?: JSONObject.NULL)
                call.resolve(result)
            } catch (e: Exception) {
                val result = JSObject()
                result.put("session", JSONObject.NULL)
                call.resolve(result)
            }
        }
    }

    @PluginMethod
    fun refreshSession(call: PluginCall) {
        val client = supabaseClient
        if (client == null) {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        scope.launch {
            try {
                client.auth.refreshCurrentSession()
                val session = client.auth.currentSessionOrNull()
                val result = JSObject()
                result.put("session", session?.let { sessionToJSObject(it) } ?: JSONObject.NULL)
                call.resolve(result)
            } catch (e: Exception) {
                call.reject("Session refresh failed: ${e.message}")
            }
        }
    }

    @PluginMethod
    fun getUser(call: PluginCall) {
        val client = supabaseClient
        if (client == null) {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        scope.launch {
            try {
                val user = client.auth.currentUserOrNull()
                val result = JSObject()
                result.put("user", user?.let { userToJSObject(it) } ?: JSONObject.NULL)
                call.resolve(result)
            } catch (e: Exception) {
                val result = JSObject()
                result.put("user", JSONObject.NULL)
                call.resolve(result)
            }
        }
    }

    @PluginMethod
    fun setSession(call: PluginCall) {
        val client = supabaseClient
        if (client == null) {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        val accessToken = call.getString("accessToken")
        val refreshToken = call.getString("refreshToken")

        if (accessToken.isNullOrEmpty() || refreshToken.isNullOrEmpty()) {
            call.reject("Missing accessToken or refreshToken")
            return
        }

        scope.launch {
            try {
                client.auth.importSession(
                    UserSession(
                        accessToken = accessToken,
                        refreshToken = refreshToken,
                        expiresIn = 3600,
                        tokenType = "bearer",
                        user = null
                    )
                )
                val session = client.auth.currentSessionOrNull()
                val result = JSObject()
                result.put("session", session?.let { sessionToJSObject(it) } ?: JSONObject.NULL)
                call.resolve(result)
            } catch (e: Exception) {
                call.reject("Set session failed: ${e.message}")
            }
        }
    }

    // Database Operations

    @PluginMethod
    fun select(call: PluginCall) {
        val client = supabaseClient
        if (client == null) {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        val table = call.getString("table")
        if (table.isNullOrEmpty()) {
            call.reject("Missing table name")
            return
        }

        val columns = call.getString("columns") ?: "*"
        val filter = call.getObject("filter")
        val limit = call.getInt("limit")
        val offset = call.getInt("offset")
        val orderBy = call.getString("orderBy")
        val ascending = call.getBoolean("ascending", true) ?: true
        val single = call.getBoolean("single", false) ?: false

        scope.launch {
            try {
                val result = client.postgrest.from(table).select(Columns.raw(columns)) {
                    filter?.let { f ->
                        f.keys().forEach { key ->
                            val value = f.get(key)
                            filter { eq(key, value) }
                        }
                    }

                    orderBy?.let {
                        order(it, if (ascending) Order.ASCENDING else Order.DESCENDING)
                    }

                    limit?.let {
                        limit(it.toLong())
                    }

                    offset?.let { off ->
                        val lim = limit ?: 1000
                        range(off.toLong(), (off + lim - 1).toLong())
                    }

                    if (single) {
                        single()
                    }
                }

                val jsonString = result.data
                val response = JSObject()
                try {
                    if (single) {
                        response.put("data", JSObject(jsonString))
                    } else {
                        response.put("data", JSArray(jsonString))
                    }
                } catch (e: Exception) {
                    response.put("data", jsonString)
                }
                response.put("error", JSONObject.NULL)
                call.resolve(response)
            } catch (e: Exception) {
                val response = JSObject()
                response.put("data", JSONObject.NULL)
                response.put("error", e.message)
                call.resolve(response)
            }
        }
    }

    @PluginMethod
    fun insert(call: PluginCall) {
        val client = supabaseClient
        if (client == null) {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        val table = call.getString("table")
        if (table.isNullOrEmpty()) {
            call.reject("Missing table name")
            return
        }

        val values = call.getObject("values")
        if (values == null) {
            call.reject("Missing values to insert")
            return
        }

        scope.launch {
            try {
                val jsonObject = jsObjectToJsonObject(values)
                val result = client.postgrest.from(table).insert(jsonObject) {
                    select()
                    single()
                }

                val jsonString = result.data
                val response = JSObject()
                try {
                    response.put("data", JSObject(jsonString))
                } catch (e: Exception) {
                    response.put("data", jsonString)
                }
                response.put("error", JSONObject.NULL)
                call.resolve(response)
            } catch (e: Exception) {
                val response = JSObject()
                response.put("data", JSONObject.NULL)
                response.put("error", e.message)
                call.resolve(response)
            }
        }
    }

    @PluginMethod
    fun update(call: PluginCall) {
        val client = supabaseClient
        if (client == null) {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        val table = call.getString("table")
        if (table.isNullOrEmpty()) {
            call.reject("Missing table name")
            return
        }

        val values = call.getObject("values")
        if (values == null) {
            call.reject("Missing values to update")
            return
        }

        val filter = call.getObject("filter")
        if (filter == null || filter.length() == 0) {
            call.reject("Missing filter for update operation")
            return
        }

        scope.launch {
            try {
                val jsonObject = jsObjectToJsonObject(values)
                val result = client.postgrest.from(table).update(jsonObject) {
                    filter.keys().forEach { key ->
                        val value = filter.get(key)
                        filter { eq(key, value) }
                    }
                    select()
                }

                val jsonString = result.data
                val response = JSObject()
                try {
                    response.put("data", JSArray(jsonString))
                } catch (e: Exception) {
                    response.put("data", jsonString)
                }
                response.put("error", JSONObject.NULL)
                call.resolve(response)
            } catch (e: Exception) {
                val response = JSObject()
                response.put("data", JSONObject.NULL)
                response.put("error", e.message)
                call.resolve(response)
            }
        }
    }

    @PluginMethod
    fun delete(call: PluginCall) {
        val client = supabaseClient
        if (client == null) {
            call.reject("Supabase client not initialized. Call initialize() first.")
            return
        }

        val table = call.getString("table")
        if (table.isNullOrEmpty()) {
            call.reject("Missing table name")
            return
        }

        val filter = call.getObject("filter")
        if (filter == null || filter.length() == 0) {
            call.reject("Missing filter for delete operation")
            return
        }

        scope.launch {
            try {
                val result = client.postgrest.from(table).delete {
                    filter.keys().forEach { key ->
                        val value = filter.get(key)
                        filter { eq(key, value) }
                    }
                    select()
                }

                val jsonString = result.data
                val response = JSObject()
                try {
                    response.put("data", JSArray(jsonString))
                } catch (e: Exception) {
                    response.put("data", jsonString)
                }
                response.put("error", JSONObject.NULL)
                call.resolve(response)
            } catch (e: Exception) {
                val response = JSObject()
                response.put("data", JSONObject.NULL)
                response.put("error", e.message)
                call.resolve(response)
            }
        }
    }

    @PluginMethod
    fun getPluginVersion(call: PluginCall) {
        val result = JSObject()
        result.put("version", pluginVersion)
        call.resolve(result)
    }

    // Helper Methods

    private fun sessionToJSObject(session: UserSession): JSObject {
        val obj = JSObject()
        obj.put("accessToken", session.accessToken)
        obj.put("refreshToken", session.refreshToken)
        obj.put("tokenType", session.tokenType)
        obj.put("expiresIn", session.expiresIn)
        obj.put("expiresAt", session.expiresAt?.epochSeconds ?: 0)
        session.user?.let { obj.put("user", userToJSObject(it)) }
        return obj
    }

    private fun userToJSObject(user: UserInfo): JSObject {
        val obj = JSObject()
        obj.put("id", user.id)
        user.email?.let { obj.put("email", it) }
        user.phone?.let { obj.put("phone", it) }
        user.createdAt?.let { obj.put("createdAt", it.toString()) }
        user.lastSignInAt?.let { obj.put("lastSignInAt", it.toString()) }
        user.userMetadata?.let { metadata ->
            try {
                val jsonString = Json.encodeToString(JsonObject.serializer(), metadata)
                obj.put("userMetadata", JSObject(jsonString))
            } catch (e: Exception) {
                // Ignore serialization errors
            }
        }
        user.appMetadata?.let { metadata ->
            try {
                val jsonString = Json.encodeToString(JsonObject.serializer(), metadata)
                obj.put("appMetadata", JSObject(jsonString))
            } catch (e: Exception) {
                // Ignore serialization errors
            }
        }
        return obj
    }

    private fun jsObjectToJsonObject(jsObject: JSObject): JsonObject {
        return buildJsonObject {
            jsObject.keys().forEach { key ->
                val value = jsObject.get(key)
                when (value) {
                    is String -> put(key, JsonPrimitive(value))
                    is Number -> put(key, JsonPrimitive(value))
                    is Boolean -> put(key, JsonPrimitive(value))
                    is JSObject -> put(key, jsObjectToJsonObject(value))
                    null -> put(key, kotlinx.serialization.json.JsonNull)
                    else -> put(key, JsonPrimitive(value.toString()))
                }
            }
        }
    }

    private fun getOAuthProvider(provider: String): io.github.jan.supabase.auth.providers.OAuthProvider? {
        return when (provider.lowercase()) {
            "apple" -> io.github.jan.supabase.auth.providers.Apple
            "azure" -> io.github.jan.supabase.auth.providers.Azure
            "bitbucket" -> io.github.jan.supabase.auth.providers.Bitbucket
            "discord" -> io.github.jan.supabase.auth.providers.Discord
            "facebook" -> io.github.jan.supabase.auth.providers.Facebook
            "figma" -> io.github.jan.supabase.auth.providers.Figma
            "github" -> io.github.jan.supabase.auth.providers.Github
            "gitlab" -> io.github.jan.supabase.auth.providers.Gitlab
            "google" -> io.github.jan.supabase.auth.providers.Google
            "kakao" -> io.github.jan.supabase.auth.providers.Kakao
            "keycloak" -> io.github.jan.supabase.auth.providers.Keycloak
            "linkedin" -> io.github.jan.supabase.auth.providers.LinkedIn
            "linkedin_oidc" -> io.github.jan.supabase.auth.providers.LinkedInOIDC
            "notion" -> io.github.jan.supabase.auth.providers.Notion
            "slack" -> io.github.jan.supabase.auth.providers.Slack
            "slack_oidc" -> io.github.jan.supabase.auth.providers.SlackOIDC
            "spotify" -> io.github.jan.supabase.auth.providers.Spotify
            "twitch" -> io.github.jan.supabase.auth.providers.Twitch
            "twitter" -> io.github.jan.supabase.auth.providers.Twitter
            "zoom" -> io.github.jan.supabase.auth.providers.Zoom
            else -> null
        }
    }

    private fun getEmailOtpType(type: String): io.github.jan.supabase.auth.OtpType.Email {
        return when (type.lowercase()) {
            "signup" -> io.github.jan.supabase.auth.OtpType.Email.SIGNUP
            "magiclink" -> io.github.jan.supabase.auth.OtpType.Email.MAGIC_LINK
            "recovery" -> io.github.jan.supabase.auth.OtpType.Email.RECOVERY
            "email" -> io.github.jan.supabase.auth.OtpType.Email.EMAIL
            else -> io.github.jan.supabase.auth.OtpType.Email.EMAIL
        }
    }

    private fun getPhoneOtpType(type: String): io.github.jan.supabase.auth.OtpType.Phone {
        return when (type.lowercase()) {
            "sms" -> io.github.jan.supabase.auth.OtpType.Phone.SMS
            else -> io.github.jan.supabase.auth.OtpType.Phone.SMS
        }
    }
}
