// Source of truth for the keys. Other languages must have the same shape
// (see `Translations`), so TypeScript tells us when one is missing a text.
export const es = {
  common: {
    networkError: 'Algo ha salido mal. Revisa tu conexión e inténtalo de nuevo.',
  },
  tabs: {
    home: 'Inicio',
    explore: 'Explorar',
  },
  auth: {
    yourName: 'Tu nombre',
    email: 'Correo electrónico',
    password: 'Contraseña',
    signIn: 'Iniciar sesión',
    signOut: 'Cerrar sesión',
    createAccount: 'Crear cuenta',
    switchToSignUp: 'Crear una cuenta',
    switchToSignIn: 'Ya tengo cuenta',
    checkEmail: 'Revisa tu correo para confirmar tu cuenta.',
  },
  groups: {
    yourGroups: 'Tus grupos',
    empty: 'Aún no tienes grupos. Crea uno para empezar a contar.',
    loadError: 'No se han podido cargar tus grupos. Revisa tu conexión.',
    create: 'Crear grupo',
    newTitle: 'Nuevo grupo',
    namePlaceholder: 'Nombre del grupo',
    whatAreYou: '¿Qué sois?',
    kinds: {
      couple: 'Pareja',
      flatmates: 'Compañerxs de piso',
      throuple: 'Trieja',
      family: 'Familia',
      lovers: 'Amantes',
      other: 'Otro',
    },
  },
};

export type Translations = typeof es;
