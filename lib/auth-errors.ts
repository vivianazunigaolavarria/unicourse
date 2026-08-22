type UnknownError = {
  code?: string;
  message?: string;
  name?: string;
  status?: number;
} | null;

function includesAny(value: string, fragments: string[]) {
  return fragments.some((fragment) => value.includes(fragment));
}

export function mapAuthErrorToSpanish(error: UnknownError, fallback = "No pudimos completar la acción. Intenta nuevamente.") {
  const message = error?.message?.toLowerCase() ?? "";
  const code = error?.code?.toLowerCase() ?? "";

  if (!message && !code) {
    return fallback;
  }

  if (includesAny(code, ["email_address_invalid", "validation_failed"]) || includesAny(message, ["invalid email", "unable to validate email"])) {
    return "Revisa que tu correo esté escrito correctamente.";
  }

  if (includesAny(code, ["email_exists", "user_already_exists", "user_already_registered"]) || includesAny(message, ["user already registered", "already been registered"])) {
    return "Ya existe una cuenta con este correo. ¿Quieres iniciar sesión?";
  }

  if (includesAny(code, ["weak_password"]) || includesAny(message, ["password should be at least", "password must be at least", "weak password"])) {
    return "Tu contraseña debe tener al menos 8 caracteres.";
  }

  if (includesAny(code, ["invalid_credentials", "bad_json"]) || includesAny(message, ["invalid login credentials", "invalid credentials"])) {
    return "El correo o la contraseña no son correctos.";
  }

  if (includesAny(code, ["email_not_confirmed"]) || includesAny(message, ["email not confirmed", "email address not authorized"])) {
    return "Primero necesitamos confirmar tu correo. Revisa tu bandeja de entrada.";
  }

  if (includesAny(code, ["otp_expired", "access_denied"]) || includesAny(message, ["expired", "access denied", "token has expired", "token is invalid"])) {
    return "Ese enlace ya no es válido. Solicita uno nuevo para continuar.";
  }

  if (includesAny(code, ["over_email_send_rate_limit"]) || includesAny(message, ["rate limit", "too many requests"])) {
    return "Acabamos de enviar un correo. Espera un momento antes de volver a intentarlo.";
  }

  if (includesAny(message, ["fetch failed", "network", "load failed"])) {
    return "No pudimos completar el registro. Intenta nuevamente.";
  }

  return fallback;
}
