import { VendureError } from '@karcher/graphql';

/** French messages for the error results Vendure's Shop API returns to shoppers. */
const MESSAGES: Record<string, string> = {
  INSUFFICIENT_STOCK_ERROR: 'Stock insuffisant pour cette quantité.',
  NEGATIVE_QUANTITY_ERROR: 'La quantité doit être positive.',
  ORDER_LIMIT_ERROR: 'Quantité maximale atteinte pour cette commande.',
  ORDER_MODIFICATION_ERROR: 'Cette commande ne peut plus être modifiée.',
  ORDER_STATE_TRANSITION_ERROR: 'Cette étape de la commande n’est pas possible pour le moment.',
  NO_ACTIVE_ORDER_ERROR: 'Votre panier est vide.',
  INELIGIBLE_SHIPPING_METHOD_ERROR:
    'Ce mode de livraison n’est pas disponible pour votre commande.',
  INELIGIBLE_PAYMENT_METHOD_ERROR: 'Ce moyen de paiement n’est pas disponible pour votre commande.',
  PAYMENT_DECLINED_ERROR: 'Le paiement a été refusé.',
  PAYMENT_FAILED_ERROR: 'Le paiement a échoué.',
  GUEST_CHECKOUT_ERROR:
    'Un compte existe avec cette adresse e-mail : connectez-vous pour commander.',
  ALREADY_LOGGED_IN_ERROR: 'Vous êtes déjà connecté.',
  INVALID_CREDENTIALS_ERROR: 'Adresse e-mail ou mot de passe incorrect.',
  NOT_VERIFIED_ERROR:
    'Votre compte n’est pas encore activé : ouvrez le lien de l’e-mail de confirmation.',
  EMAIL_ADDRESS_CONFLICT_ERROR: 'Un compte existe déjà avec cette adresse e-mail.',
  PASSWORD_VALIDATION_ERROR: 'Ce mot de passe n’est pas accepté : choisissez-en un plus long.',
  MISSING_PASSWORD_ERROR: 'Choisissez un mot de passe.',
  PASSWORD_ALREADY_SET_ERROR: 'Le mot de passe de ce compte est déjà défini.',
  VERIFICATION_TOKEN_INVALID_ERROR: 'Ce lien d’activation n’est pas valide.',
  VERIFICATION_TOKEN_EXPIRED_ERROR: 'Ce lien d’activation a expiré : inscrivez-vous de nouveau.',
  PASSWORD_RESET_TOKEN_INVALID_ERROR: 'Ce lien de réinitialisation n’est pas valide.',
  PASSWORD_RESET_TOKEN_EXPIRED_ERROR:
    'Ce lien de réinitialisation a expiré : demandez-en un nouveau.',
  IDENTIFIER_CHANGE_TOKEN_INVALID_ERROR: 'Ce lien de confirmation n’est pas valide.',
  IDENTIFIER_CHANGE_TOKEN_EXPIRED_ERROR: 'Ce lien de confirmation a expiré.',
};

const GENERIC = 'Une erreur est survenue. Réessayez dans un instant.';

/** Message for an ErrorResult's errorCode. */
export function errorMessage(errorCode: string): string {
  return MESSAGES[errorCode] ?? GENERIC;
}

/** Message for an exception thrown while calling Vendure; anything unexpected is rethrown. */
export function thrownErrorMessage(error: unknown): string {
  if (error instanceof VendureError) {
    console.error('[vendure]', error.message);
    return GENERIC;
  }
  throw error;
}

/** Shape of an ErrorResult member in a mutation's result union. */
export interface ErrorResultLike {
  __typename: string;
  errorCode?: string;
  message?: string;
}

/** The French message when `result` is an ErrorResult, else null. */
export function resultError(result: ErrorResultLike | null | undefined): string | null {
  return result && 'errorCode' in result && result.errorCode
    ? errorMessage(result.errorCode)
    : null;
}
