// Source of truth for the keys. `TranslationKey` (see index.ts) is derived from
// this object, so t('a.typo') fails to compile. Other languages must have the same
// shape (`Translations`), so TypeScript also flags a language missing a text.
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
    join: 'Unirme con código',
    joinTitle: 'Unirme a un grupo',
    codePlaceholder: 'Código de invitación',
    joinAction: 'Unirme',
    invalidCode: 'Ese código no existe. Revísalo e inténtalo de nuevo.',
    tooManyAttempts: 'Demasiados intentos fallidos. Espera unos minutos.',
    shareCode: 'Compartir código',
    shareMessage: 'Únete a «{{name}}» en Splitlove con este código: {{code}}',
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
