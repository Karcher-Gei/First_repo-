import { graphql } from '@karcher/graphql';

/*
 * Cart and checkout documents, run with the shopper's session (see session.ts).
 * Mutations select `__typename` so their result unions can be told apart.
 */

graphql(`
  fragment CartOrder on Order {
    id
    code
    state
    active
    totalQuantity
    subTotalWithTax
    shippingWithTax
    totalWithTax
    customer {
      id
      firstName
      lastName
      emailAddress
      phoneNumber
    }
    shippingAddress {
      fullName
      streetLine1
      streetLine2
      city
      province
      postalCode
      phoneNumber
    }
    shippingLines {
      priceWithTax
      shippingMethod {
        id
        name
      }
    }
    discounts {
      description
      amountWithTax
    }
    lines {
      id
      quantity
      unitPriceWithTax
      linePriceWithTax
      featuredAsset {
        preview
      }
      productVariant {
        id
        name
        sku
        product {
          ...ProductSummary
        }
      }
    }
  }
`);

export const ACTIVE_ORDER = graphql(`
  query ActiveOrder {
    activeOrder {
      ...CartOrder
    }
  }
`);

export const CART_COUNT = graphql(`
  query CartCount {
    activeOrder {
      totalQuantity
    }
  }
`);

export const ADD_TO_CART = graphql(`
  mutation AddToCart($variantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $variantId, quantity: $quantity) {
      __typename
      ... on Order {
        totalQuantity
      }
      ... on InsufficientStockError {
        quantityAvailable
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const ADJUST_LINE = graphql(`
  mutation AdjustLine($lineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $lineId, quantity: $quantity) {
      __typename
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const REMOVE_LINE = graphql(`
  mutation RemoveLine($lineId: ID!) {
    removeOrderLine(orderLineId: $lineId) {
      __typename
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const TRANSITION_ORDER = graphql(`
  mutation TransitionOrder($state: String!) {
    transitionOrderToState(state: $state) {
      __typename
      ... on Order {
        state
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const CHECKOUT_OPTIONS = graphql(`
  query CheckoutOptions {
    activeOrder {
      ...CartOrder
    }
    activeCustomer {
      id
      firstName
      lastName
      emailAddress
      phoneNumber
      addresses {
        fullName
        streetLine1
        streetLine2
        city
        province
        postalCode
        phoneNumber
        defaultShippingAddress
      }
    }
    eligibleShippingMethods {
      id
      name
      description
      priceWithTax
    }
    eligiblePaymentMethods {
      code
      name
      description
      isEligible
    }
  }
`);

export const SET_CUSTOMER_FOR_ORDER = graphql(`
  mutation SetCustomerForOrder($input: CreateCustomerInput!) {
    setCustomerForOrder(input: $input) {
      __typename
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const SET_SHIPPING_ADDRESS = graphql(`
  mutation SetShippingAddress($input: CreateAddressInput!) {
    setOrderShippingAddress(input: $input) {
      __typename
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const SET_SHIPPING_METHOD = graphql(`
  mutation SetShippingMethod($ids: [ID!]!) {
    setOrderShippingMethod(shippingMethodId: $ids) {
      __typename
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const CREATE_KONNECT_PAYMENT = graphql(`
  mutation CreateKonnectPayment {
    createKonnectPaymentIntent
  }
`);

export const ADD_PAYMENT = graphql(`
  mutation AddPayment($input: PaymentInput!) {
    addPaymentToOrder(input: $input) {
      __typename
      ... on Order {
        code
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export const ORDER_BY_CODE = graphql(`
  query OrderByCode($code: String!) {
    orderByCode(code: $code) {
      ...CartOrder
    }
  }
`);
