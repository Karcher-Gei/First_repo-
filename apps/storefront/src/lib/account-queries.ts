import { graphql } from '@karcher/graphql';

/* Customer account documents, run with the shopper's session (see session.ts). */

graphql(`
  fragment AccountAddress on Address {
    id
    fullName
    streetLine1
    streetLine2
    city
    province
    postalCode
    phoneNumber
    defaultShippingAddress
    defaultBillingAddress
  }
`);

export const ACTIVE_CUSTOMER = graphql(`
  query ActiveCustomer {
    activeCustomer {
      id
      firstName
      lastName
      emailAddress
      phoneNumber
    }
  }
`);

export const CUSTOMER_ADDRESSES = graphql(`
  query CustomerAddresses {
    activeCustomer {
      id
      addresses {
        ...AccountAddress
      }
    }
  }
`);

export const CUSTOMER_ORDERS = graphql(`
  query CustomerOrders($skip: Int!, $take: Int!) {
    activeCustomer {
      id
      orders(
        options: {
          skip: $skip
          take: $take
          sort: { orderPlacedAt: DESC }
          filter: { active: { eq: false } }
        }
      ) {
        totalItems
        items {
          id
          code
          state
          orderPlacedAt
          totalQuantity
          totalWithTax
        }
      }
    }
  }
`);

export const LOGIN = graphql(`
  mutation Login($username: String!, $password: String!, $rememberMe: Boolean) {
    login(username: $username, password: $password, rememberMe: $rememberMe) {
      __typename
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const LOGOUT = graphql(`
  mutation Logout {
    logout {
      success
    }
  }
`);

export const REGISTER = graphql(`
  mutation Register($input: RegisterCustomerInput!) {
    registerCustomerAccount(input: $input) {
      __typename
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const VERIFY_ACCOUNT = graphql(`
  mutation VerifyAccount($token: String!) {
    verifyCustomerAccount(token: $token) {
      __typename
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const REQUEST_PASSWORD_RESET = graphql(`
  mutation RequestPasswordReset($emailAddress: String!) {
    requestPasswordReset(emailAddress: $emailAddress) {
      __typename
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const RESET_PASSWORD = graphql(`
  mutation ResetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password) {
      __typename
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const UPDATE_CUSTOMER = graphql(`
  mutation UpdateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
    }
  }
`);

export const UPDATE_PASSWORD = graphql(`
  mutation UpdatePassword($currentPassword: String!, $newPassword: String!) {
    updateCustomerPassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      __typename
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const REQUEST_EMAIL_CHANGE = graphql(`
  mutation RequestEmailChange($password: String!, $newEmailAddress: String!) {
    requestUpdateCustomerEmailAddress(password: $password, newEmailAddress: $newEmailAddress) {
      __typename
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const CONFIRM_EMAIL_CHANGE = graphql(`
  mutation ConfirmEmailChange($token: String!) {
    updateCustomerEmailAddress(token: $token) {
      __typename
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const CREATE_ADDRESS = graphql(`
  mutation CreateAddress($input: CreateAddressInput!) {
    createCustomerAddress(input: $input) {
      id
    }
  }
`);

export const SET_DEFAULT_ADDRESS = graphql(`
  mutation SetDefaultAddress($id: ID!) {
    updateCustomerAddress(
      input: { id: $id, defaultShippingAddress: true, defaultBillingAddress: true }
    ) {
      id
    }
  }
`);

export const DELETE_ADDRESS = graphql(`
  mutation DeleteAddress($id: ID!) {
    deleteCustomerAddress(id: $id) {
      success
    }
  }
`);
