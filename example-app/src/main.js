import './style.css';
import { CapacitorSupabase } from '@capgo/capacitor-supabase';

const plugin = CapacitorSupabase;
const state = {};

const actions = [
  {
    id: 'initialize',
    label: 'Initialize',
    description: 'Initialize the Supabase client with your project credentials.',
    inputs: [
      { name: 'supabaseUrl', label: 'Supabase URL', type: 'text', placeholder: 'https://your-project.supabase.co' },
      { name: 'supabaseKey', label: 'Supabase Anon Key', type: 'text', placeholder: 'your-anon-key' },
    ],
    run: async (values) => {
      await plugin.initialize({
        supabaseUrl: values.supabaseUrl,
        supabaseKey: values.supabaseKey,
      });
      return 'Supabase client initialized successfully.';
    },
  },
  {
    id: 'sign-in-password',
    label: 'Sign in with password',
    description: 'Sign in with email and password.',
    inputs: [
      { name: 'email', label: 'Email', type: 'text', placeholder: 'user@example.com' },
      { name: 'password', label: 'Password', type: 'text', placeholder: 'password' },
    ],
    run: async (values) => {
      const result = await plugin.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      return result;
    },
  },
  {
    id: 'sign-up',
    label: 'Sign up',
    description: 'Sign up a new user with email and password.',
    inputs: [
      { name: 'email', label: 'Email', type: 'text', placeholder: 'user@example.com' },
      { name: 'password', label: 'Password', type: 'text', placeholder: 'password' },
    ],
    run: async (values) => {
      const result = await plugin.signUp({
        email: values.email,
        password: values.password,
      });
      return result;
    },
  },
  {
    id: 'sign-in-oauth',
    label: 'Sign in with OAuth',
    description: 'Sign in with an OAuth provider (opens external browser).',
    inputs: [
      {
        name: 'provider',
        label: 'Provider',
        type: 'select',
        value: 'google',
        options: [
          { value: 'google', label: 'Google' },
          { value: 'apple', label: 'Apple' },
          { value: 'github', label: 'GitHub' },
          { value: 'facebook', label: 'Facebook' },
          { value: 'twitter', label: 'Twitter' },
        ],
      },
    ],
    run: async (values) => {
      await plugin.signInWithOAuth({ provider: values.provider });
      return 'OAuth sign in initiated. Complete in external browser.';
    },
  },
  {
    id: 'sign-in-otp',
    label: 'Sign in with OTP',
    description: 'Send a one-time password to email or phone.',
    inputs: [{ name: 'email', label: 'Email', type: 'text', placeholder: 'user@example.com' }],
    run: async (values) => {
      await plugin.signInWithOtp({ email: values.email });
      return 'OTP sent to ' + values.email;
    },
  },
  {
    id: 'verify-otp',
    label: 'Verify OTP',
    description: 'Verify the one-time password received.',
    inputs: [
      { name: 'email', label: 'Email', type: 'text', placeholder: 'user@example.com' },
      { name: 'token', label: 'OTP Token', type: 'text', placeholder: '123456' },
      {
        name: 'type',
        label: 'Type',
        type: 'select',
        value: 'email',
        options: [
          { value: 'email', label: 'Email' },
          { value: 'magiclink', label: 'Magic Link' },
          { value: 'signup', label: 'Signup' },
          { value: 'recovery', label: 'Recovery' },
        ],
      },
    ],
    run: async (values) => {
      const result = await plugin.verifyOtp({
        email: values.email,
        token: values.token,
        type: values.type,
      });
      return result;
    },
  },
  {
    id: 'get-session',
    label: 'Get session',
    description: 'Get the current session with JWT access token.',
    inputs: [],
    run: async () => {
      const result = await plugin.getSession();
      return result;
    },
  },
  {
    id: 'get-user',
    label: 'Get user',
    description: 'Get the current authenticated user.',
    inputs: [],
    run: async () => {
      const result = await plugin.getUser();
      return result;
    },
  },
  {
    id: 'refresh-session',
    label: 'Refresh session',
    description: 'Refresh the current session tokens.',
    inputs: [],
    run: async () => {
      const result = await plugin.refreshSession();
      return result;
    },
  },
  {
    id: 'sign-out',
    label: 'Sign out',
    description: 'Sign out the current user.',
    inputs: [],
    run: async () => {
      await plugin.signOut();
      return 'Signed out successfully.';
    },
  },
  {
    id: 'select',
    label: 'Select (Database)',
    description: 'Execute a SELECT query on a table.',
    inputs: [
      { name: 'table', label: 'Table', type: 'text', placeholder: 'users' },
      { name: 'columns', label: 'Columns', type: 'text', value: '*' },
      { name: 'limit', label: 'Limit', type: 'number', value: 10 },
    ],
    run: async (values) => {
      const result = await plugin.select({
        table: values.table,
        columns: values.columns || '*',
        limit: values.limit || 10,
      });
      return result;
    },
  },
  {
    id: 'insert',
    label: 'Insert (Database)',
    description: 'Insert data into a table. Values should be JSON.',
    inputs: [
      { name: 'table', label: 'Table', type: 'text', placeholder: 'users' },
      {
        name: 'values',
        label: 'Values (JSON)',
        type: 'textarea',
        placeholder: '{"name": "John", "email": "john@example.com"}',
      },
    ],
    run: async (values) => {
      const parsedValues = JSON.parse(values.values);
      const result = await plugin.insert({
        table: values.table,
        values: parsedValues,
      });
      return result;
    },
  },
  {
    id: 'get-plugin-version',
    label: 'Get plugin version',
    description: 'Get the native Capacitor plugin version.',
    inputs: [],
    run: async () => {
      const result = await plugin.getPluginVersion();
      return result;
    },
  },
];

const actionSelect = document.getElementById('action-select');
const formContainer = document.getElementById('action-form');
const descriptionBox = document.getElementById('action-description');
const runButton = document.getElementById('run-action');
const output = document.getElementById('plugin-output');

function buildForm(action) {
  formContainer.innerHTML = '';
  if (!action.inputs || !action.inputs.length) {
    const note = document.createElement('p');
    note.className = 'no-input-note';
    note.textContent = 'This action does not require any inputs.';
    formContainer.appendChild(note);
    return;
  }
  action.inputs.forEach((input) => {
    const fieldWrapper = document.createElement('div');
    fieldWrapper.className = input.type === 'checkbox' ? 'form-field inline' : 'form-field';

    const label = document.createElement('label');
    label.textContent = input.label;
    label.htmlFor = `field-${input.name}`;

    let field;
    switch (input.type) {
      case 'textarea': {
        field = document.createElement('textarea');
        field.rows = input.rows || 4;
        break;
      }
      case 'select': {
        field = document.createElement('select');
        (input.options || []).forEach((option) => {
          const opt = document.createElement('option');
          opt.value = option.value;
          opt.textContent = option.label;
          if (input.value !== undefined && option.value === input.value) {
            opt.selected = true;
          }
          field.appendChild(opt);
        });
        break;
      }
      case 'checkbox': {
        field = document.createElement('input');
        field.type = 'checkbox';
        field.checked = Boolean(input.value);
        break;
      }
      case 'number': {
        field = document.createElement('input');
        field.type = 'number';
        if (input.value !== undefined && input.value !== null) {
          field.value = String(input.value);
        }
        break;
      }
      default: {
        field = document.createElement('input');
        field.type = 'text';
        if (input.value !== undefined && input.value !== null) {
          field.value = String(input.value);
        }
      }
    }

    field.id = `field-${input.name}`;
    field.name = input.name;
    field.dataset.type = input.type || 'text';

    if (input.placeholder && input.type !== 'checkbox') {
      field.placeholder = input.placeholder;
    }

    if (input.type === 'checkbox') {
      fieldWrapper.appendChild(field);
      fieldWrapper.appendChild(label);
    } else {
      fieldWrapper.appendChild(label);
      fieldWrapper.appendChild(field);
    }

    formContainer.appendChild(fieldWrapper);
  });
}

function getFormValues(action) {
  const values = {};
  (action.inputs || []).forEach((input) => {
    const field = document.getElementById(`field-${input.name}`);
    if (!field) return;
    switch (input.type) {
      case 'number': {
        values[input.name] = field.value === '' ? null : Number(field.value);
        break;
      }
      case 'checkbox': {
        values[input.name] = field.checked;
        break;
      }
      default: {
        values[input.name] = field.value;
      }
    }
  });
  return values;
}

function setAction(action) {
  descriptionBox.textContent = action.description || '';
  buildForm(action);
  output.textContent = 'Ready to run the selected action.';
}

function populateActions() {
  actionSelect.innerHTML = '';
  actions.forEach((action) => {
    const option = document.createElement('option');
    option.value = action.id;
    option.textContent = action.label;
    actionSelect.appendChild(option);
  });
  setAction(actions[0]);
}

actionSelect.addEventListener('change', () => {
  const action = actions.find((item) => item.id === actionSelect.value);
  if (action) {
    setAction(action);
  }
});

runButton.addEventListener('click', async () => {
  const action = actions.find((item) => item.id === actionSelect.value);
  if (!action) return;
  const values = getFormValues(action);
  try {
    const result = await action.run(values);
    if (result === undefined) {
      output.textContent = 'Action completed.';
    } else if (typeof result === 'string') {
      output.textContent = result;
    } else {
      output.textContent = JSON.stringify(result, null, 2);
    }
  } catch (error) {
    output.textContent = `Error: ${error?.message ?? error}`;
  }
});

populateActions();
