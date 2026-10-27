/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  fragment AccountAddress on Address {\n    id\n    fullName\n    streetLine1\n    streetLine2\n    city\n    province\n    postalCode\n    phoneNumber\n    defaultShippingAddress\n    defaultBillingAddress\n  }\n": typeof types.AccountAddressFragmentDoc,
    "\n  query ActiveCustomer {\n    activeCustomer {\n      id\n      firstName\n      lastName\n      emailAddress\n      phoneNumber\n    }\n  }\n": typeof types.ActiveCustomerDocument,
    "\n  query CustomerAddresses {\n    activeCustomer {\n      id\n      addresses {\n        ...AccountAddress\n      }\n    }\n  }\n": typeof types.CustomerAddressesDocument,
    "\n  query CustomerOrders($skip: Int!, $take: Int!) {\n    activeCustomer {\n      id\n      orders(\n        options: {\n          skip: $skip\n          take: $take\n          sort: { orderPlacedAt: DESC }\n          filter: { active: { eq: false } }\n        }\n      ) {\n        totalItems\n        items {\n          id\n          code\n          state\n          orderPlacedAt\n          totalQuantity\n          totalWithTax\n        }\n      }\n    }\n  }\n": typeof types.CustomerOrdersDocument,
    "\n  mutation Login($username: String!, $password: String!, $rememberMe: Boolean) {\n    login(username: $username, password: $password, rememberMe: $rememberMe) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.LoginDocument,
    "\n  mutation Logout {\n    logout {\n      success\n    }\n  }\n": typeof types.LogoutDocument,
    "\n  mutation Register($input: RegisterCustomerInput!) {\n    registerCustomerAccount(input: $input) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.RegisterDocument,
    "\n  mutation VerifyAccount($token: String!) {\n    verifyCustomerAccount(token: $token) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.VerifyAccountDocument,
    "\n  mutation RequestPasswordReset($emailAddress: String!) {\n    requestPasswordReset(emailAddress: $emailAddress) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.RequestPasswordResetDocument,
    "\n  mutation ResetPassword($token: String!, $password: String!) {\n    resetPassword(token: $token, password: $password) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.ResetPasswordDocument,
    "\n  mutation UpdateCustomer($input: UpdateCustomerInput!) {\n    updateCustomer(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateCustomerDocument,
    "\n  mutation UpdatePassword($currentPassword: String!, $newPassword: String!) {\n    updateCustomerPassword(currentPassword: $currentPassword, newPassword: $newPassword) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.UpdatePasswordDocument,
    "\n  mutation RequestEmailChange($password: String!, $newEmailAddress: String!) {\n    requestUpdateCustomerEmailAddress(password: $password, newEmailAddress: $newEmailAddress) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.RequestEmailChangeDocument,
    "\n  mutation ConfirmEmailChange($token: String!) {\n    updateCustomerEmailAddress(token: $token) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.ConfirmEmailChangeDocument,
    "\n  mutation CreateAddress($input: CreateAddressInput!) {\n    createCustomerAddress(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateAddressDocument,
    "\n  mutation SetDefaultAddress($id: ID!) {\n    updateCustomerAddress(\n      input: { id: $id, defaultShippingAddress: true, defaultBillingAddress: true }\n    ) {\n      id\n    }\n  }\n": typeof types.SetDefaultAddressDocument,
    "\n  mutation DeleteAddress($id: ID!) {\n    deleteCustomerAddress(id: $id) {\n      success\n    }\n  }\n": typeof types.DeleteAddressDocument,
    "\n  fragment CartOrder on Order {\n    id\n    code\n    state\n    active\n    totalQuantity\n    subTotalWithTax\n    shippingWithTax\n    totalWithTax\n    customer {\n      id\n      firstName\n      lastName\n      emailAddress\n      phoneNumber\n    }\n    shippingAddress {\n      fullName\n      streetLine1\n      streetLine2\n      city\n      province\n      postalCode\n      phoneNumber\n    }\n    shippingLines {\n      priceWithTax\n      shippingMethod {\n        id\n        name\n      }\n    }\n    discounts {\n      description\n      amountWithTax\n    }\n    lines {\n      id\n      quantity\n      unitPriceWithTax\n      linePriceWithTax\n      featuredAsset {\n        preview\n      }\n      productVariant {\n        id\n        name\n        sku\n        product {\n          ...ProductSummary\n        }\n      }\n    }\n  }\n": typeof types.CartOrderFragmentDoc,
    "\n  query ActiveOrder {\n    activeOrder {\n      ...CartOrder\n    }\n  }\n": typeof types.ActiveOrderDocument,
    "\n  query CartCount {\n    activeOrder {\n      totalQuantity\n    }\n  }\n": typeof types.CartCountDocument,
    "\n  mutation AddToCart($variantId: ID!, $quantity: Int!) {\n    addItemToOrder(productVariantId: $variantId, quantity: $quantity) {\n      __typename\n      ... on Order {\n        totalQuantity\n      }\n      ... on InsufficientStockError {\n        quantityAvailable\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.AddToCartDocument,
    "\n  mutation AdjustLine($lineId: ID!, $quantity: Int!) {\n    adjustOrderLine(orderLineId: $lineId, quantity: $quantity) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.AdjustLineDocument,
    "\n  mutation RemoveLine($lineId: ID!) {\n    removeOrderLine(orderLineId: $lineId) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.RemoveLineDocument,
    "\n  mutation TransitionOrder($state: String!) {\n    transitionOrderToState(state: $state) {\n      __typename\n      ... on Order {\n        state\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.TransitionOrderDocument,
    "\n  query CheckoutOptions {\n    activeOrder {\n      ...CartOrder\n    }\n    activeCustomer {\n      id\n      firstName\n      lastName\n      emailAddress\n      phoneNumber\n      addresses {\n        fullName\n        streetLine1\n        streetLine2\n        city\n        province\n        postalCode\n        phoneNumber\n        defaultShippingAddress\n      }\n    }\n    eligibleShippingMethods {\n      id\n      name\n      description\n      priceWithTax\n    }\n    eligiblePaymentMethods {\n      code\n      name\n      description\n      isEligible\n    }\n  }\n": typeof types.CheckoutOptionsDocument,
    "\n  mutation SetCustomerForOrder($input: CreateCustomerInput!) {\n    setCustomerForOrder(input: $input) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.SetCustomerForOrderDocument,
    "\n  mutation SetShippingAddress($input: CreateAddressInput!) {\n    setOrderShippingAddress(input: $input) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.SetShippingAddressDocument,
    "\n  mutation SetShippingMethod($ids: [ID!]!) {\n    setOrderShippingMethod(shippingMethodId: $ids) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.SetShippingMethodDocument,
    "\n  mutation CreateKonnectPayment {\n    createKonnectPaymentIntent\n  }\n": typeof types.CreateKonnectPaymentDocument,
    "\n  mutation AddPayment($input: PaymentInput!) {\n    addPaymentToOrder(input: $input) {\n      __typename\n      ... on Order {\n        code\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.AddPaymentDocument,
    "\n  query OrderByCode($code: String!) {\n    orderByCode(code: $code) {\n      ...CartOrder\n    }\n  }\n": typeof types.OrderByCodeDocument,
    "\n  fragment ProductSummary on Product {\n    id\n    name\n    slug\n    featuredAsset {\n      preview\n      customFields {\n        alt\n      }\n    }\n    customFields {\n      legacyId\n      ean13\n      urlCategory\n      quoteOnly\n    }\n    variants {\n      priceWithTax\n      customFields {\n        regularPrice\n      }\n    }\n  }\n": typeof types.ProductSummaryFragmentDoc,
    "\n  fragment VariantSummary on ProductVariant {\n    id\n    priceWithTax\n    product {\n      ...ProductSummary\n    }\n  }\n": typeof types.VariantSummaryFragmentDoc,
    "\n  fragment CollectionWithProducts on Collection {\n    id\n    name\n    slug\n    description\n    customFields {\n      legacyId\n    }\n    productVariants(options: { take: $take }) {\n      totalItems\n      items {\n        ...VariantSummary\n      }\n    }\n  }\n": typeof types.CollectionWithProductsFragmentDoc,
    "\n  query ProductByLegacyId($legacyId: Float!) {\n    products(options: { take: 1, filter: { legacyId: { eq: $legacyId } } }) {\n      items {\n        ...ProductSummary\n        description\n        seo: customFields {\n          metaTitle\n          metaDescription\n        }\n        assets {\n          preview\n          customFields {\n            alt\n          }\n        }\n        facetValues {\n          id\n          name\n          facet {\n            id\n            name\n          }\n        }\n        collections {\n          id\n          name\n          slug\n          breadcrumbs {\n            id\n          }\n          customFields {\n            legacyId\n          }\n          parent {\n            name\n            slug\n            customFields {\n              legacyId\n            }\n          }\n        }\n        variants {\n          id\n          name\n          sku\n          priceWithTax\n          stockLevel\n          options {\n            name\n          }\n          customFields {\n            regularPrice\n            saleEndsAt\n          }\n        }\n      }\n    }\n  }\n": typeof types.ProductByLegacyIdDocument,
    "\n  fragment CategoryLink on Collection {\n    id\n    name\n    slug\n    featuredAsset {\n      preview\n    }\n    customFields {\n      legacyId\n    }\n  }\n": typeof types.CategoryLinkFragmentDoc,
    "\n  query CollectionByLegacyId($legacyId: Float!) {\n    collections(options: { take: 1, filter: { legacyId: { eq: $legacyId } } }) {\n      items {\n        id\n        name\n        slug\n        description\n        featuredAsset {\n          preview\n        }\n        customFields {\n          legacyId\n          metaTitle\n          metaDescription\n          filterFacetIds\n        }\n        parent {\n          ...CategoryLink\n          parent {\n            ...CategoryLink\n          }\n        }\n        children {\n          ...CategoryLink\n          position\n        }\n      }\n    }\n  }\n": typeof types.CollectionByLegacyIdDocument,
    "\n  query Brands {\n    facets(options: { filter: { code: { eq: \"marque\" } } }) {\n      items {\n        values {\n          id\n          name\n          customFields {\n            legacyManufacturerId\n            description\n            metaTitle\n            metaDescription\n          }\n        }\n      }\n    }\n  }\n": typeof types.BrandsDocument,
    "\n  query ListingFacets($input: SearchInput!) {\n    search(input: $input) {\n      totalItems\n      facetValues {\n        count\n        facetValue {\n          id\n          name\n          facet {\n            id\n            name\n          }\n        }\n      }\n    }\n  }\n": typeof types.ListingFacetsDocument,
    "\n  query CategoryPage($input: SearchInput!) {\n    search(input: $input) {\n      totalItems\n      items {\n        productId\n        priceWithTax {\n          ... on SinglePrice {\n            value\n          }\n          ... on PriceRange {\n            min\n            max\n          }\n        }\n      }\n    }\n  }\n": typeof types.CategoryPageDocument,
    "\n  query ProductsByIds($ids: [String!]!, $take: Int!) {\n    products(options: { take: $take, filter: { id: { in: $ids } } }) {\n      items {\n        ...ProductSummary\n      }\n    }\n  }\n": typeof types.ProductsByIdsDocument,
    "\n  query CollectionBySlug($slug: String!, $take: Int!) {\n    collection(slug: $slug) {\n      ...CollectionWithProducts\n    }\n  }\n": typeof types.CollectionBySlugDocument,
    "\n  query CollectionIdBySlug($slug: String!) {\n    collection(slug: $slug) {\n      id\n    }\n  }\n": typeof types.CollectionIdBySlugDocument,
    "\n  query RankedProducts($options: ProductListOptions!) {\n    products(options: $options) {\n      totalItems\n      items {\n        ...ProductSummary\n      }\n    }\n  }\n": typeof types.RankedProductsDocument,
    "\n  query LegacyImage($imageId: Int!) {\n    legacyImage(imageId: $imageId) {\n      preview\n    }\n  }\n": typeof types.LegacyImageDocument,
    "\n  query LegacyRedirect($path: String!) {\n    legacyRedirect(path: $path) {\n      toPath\n      statusCode\n    }\n  }\n": typeof types.LegacyRedirectDocument,
    "\n  mutation SubmitForm($input: SubmitFormInput!) {\n    submitForm(input: $input)\n  }\n": typeof types.SubmitFormDocument,
    "\n  query SitemapProducts($skip: Int!, $take: Int!) {\n    products(options: { skip: $skip, take: $take }) {\n      totalItems\n      items {\n        slug\n        updatedAt\n        customFields {\n          legacyId\n          ean13\n          urlCategory\n        }\n      }\n    }\n  }\n": typeof types.SitemapProductsDocument,
    "\n  query SitemapCollections($skip: Int!, $take: Int!) {\n    collections(options: { skip: $skip, take: $take }) {\n      items {\n        slug\n        updatedAt\n        customFields {\n          legacyId\n        }\n      }\n    }\n  }\n": typeof types.SitemapCollectionsDocument,
    "\n  query CategoryTree {\n    collections(options: { topLevelOnly: true, take: 50, sort: { position: ASC } }) {\n      items {\n        id\n        name\n        slug\n        featuredAsset {\n          preview\n        }\n        customFields {\n          legacyId\n        }\n        children {\n          id\n          name\n          slug\n          featuredAsset {\n            preview\n          }\n          position\n          customFields {\n            legacyId\n          }\n        }\n      }\n    }\n  }\n": typeof types.CategoryTreeDocument,
    "\n  query QuoteProduct($id: ID!) {\n    product(id: $id) {\n      id\n      name\n      variants {\n        id\n        name\n        sku\n      }\n    }\n  }\n": typeof types.QuoteProductDocument,
    "\n  mutation RequestQuote($input: RequestQuoteInput!) {\n    requestQuote(input: $input)\n  }\n": typeof types.RequestQuoteDocument,
    "\n  mutation RegisterWarranty($input: RegisterWarrantyInput!) {\n    registerWarranty(input: $input)\n  }\n": typeof types.RegisterWarrantyDocument,
};
const documents: Documents = {
    "\n  fragment AccountAddress on Address {\n    id\n    fullName\n    streetLine1\n    streetLine2\n    city\n    province\n    postalCode\n    phoneNumber\n    defaultShippingAddress\n    defaultBillingAddress\n  }\n": types.AccountAddressFragmentDoc,
    "\n  query ActiveCustomer {\n    activeCustomer {\n      id\n      firstName\n      lastName\n      emailAddress\n      phoneNumber\n    }\n  }\n": types.ActiveCustomerDocument,
    "\n  query CustomerAddresses {\n    activeCustomer {\n      id\n      addresses {\n        ...AccountAddress\n      }\n    }\n  }\n": types.CustomerAddressesDocument,
    "\n  query CustomerOrders($skip: Int!, $take: Int!) {\n    activeCustomer {\n      id\n      orders(\n        options: {\n          skip: $skip\n          take: $take\n          sort: { orderPlacedAt: DESC }\n          filter: { active: { eq: false } }\n        }\n      ) {\n        totalItems\n        items {\n          id\n          code\n          state\n          orderPlacedAt\n          totalQuantity\n          totalWithTax\n        }\n      }\n    }\n  }\n": types.CustomerOrdersDocument,
    "\n  mutation Login($username: String!, $password: String!, $rememberMe: Boolean) {\n    login(username: $username, password: $password, rememberMe: $rememberMe) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": types.LoginDocument,
    "\n  mutation Logout {\n    logout {\n      success\n    }\n  }\n": types.LogoutDocument,
    "\n  mutation Register($input: RegisterCustomerInput!) {\n    registerCustomerAccount(input: $input) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": types.RegisterDocument,
    "\n  mutation VerifyAccount($token: String!) {\n    verifyCustomerAccount(token: $token) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": types.VerifyAccountDocument,
    "\n  mutation RequestPasswordReset($emailAddress: String!) {\n    requestPasswordReset(emailAddress: $emailAddress) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": types.RequestPasswordResetDocument,
    "\n  mutation ResetPassword($token: String!, $password: String!) {\n    resetPassword(token: $token, password: $password) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": types.ResetPasswordDocument,
    "\n  mutation UpdateCustomer($input: UpdateCustomerInput!) {\n    updateCustomer(input: $input) {\n      id\n    }\n  }\n": types.UpdateCustomerDocument,
    "\n  mutation UpdatePassword($currentPassword: String!, $newPassword: String!) {\n    updateCustomerPassword(currentPassword: $currentPassword, newPassword: $newPassword) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": types.UpdatePasswordDocument,
    "\n  mutation RequestEmailChange($password: String!, $newEmailAddress: String!) {\n    requestUpdateCustomerEmailAddress(password: $password, newEmailAddress: $newEmailAddress) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": types.RequestEmailChangeDocument,
    "\n  mutation ConfirmEmailChange($token: String!) {\n    updateCustomerEmailAddress(token: $token) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": types.ConfirmEmailChangeDocument,
    "\n  mutation CreateAddress($input: CreateAddressInput!) {\n    createCustomerAddress(input: $input) {\n      id\n    }\n  }\n": types.CreateAddressDocument,
    "\n  mutation SetDefaultAddress($id: ID!) {\n    updateCustomerAddress(\n      input: { id: $id, defaultShippingAddress: true, defaultBillingAddress: true }\n    ) {\n      id\n    }\n  }\n": types.SetDefaultAddressDocument,
    "\n  mutation DeleteAddress($id: ID!) {\n    deleteCustomerAddress(id: $id) {\n      success\n    }\n  }\n": types.DeleteAddressDocument,
    "\n  fragment CartOrder on Order {\n    id\n    code\n    state\n    active\n    totalQuantity\n    subTotalWithTax\n    shippingWithTax\n    totalWithTax\n    customer {\n      id\n      firstName\n      lastName\n      emailAddress\n      phoneNumber\n    }\n    shippingAddress {\n      fullName\n      streetLine1\n      streetLine2\n      city\n      province\n      postalCode\n      phoneNumber\n    }\n    shippingLines {\n      priceWithTax\n      shippingMethod {\n        id\n        name\n      }\n    }\n    discounts {\n      description\n      amountWithTax\n    }\n    lines {\n      id\n      quantity\n      unitPriceWithTax\n      linePriceWithTax\n      featuredAsset {\n        preview\n      }\n      productVariant {\n        id\n        name\n        sku\n        product {\n          ...ProductSummary\n        }\n      }\n    }\n  }\n": types.CartOrderFragmentDoc,
    "\n  query ActiveOrder {\n    activeOrder {\n      ...CartOrder\n    }\n  }\n": types.ActiveOrderDocument,
    "\n  query CartCount {\n    activeOrder {\n      totalQuantity\n    }\n  }\n": types.CartCountDocument,
    "\n  mutation AddToCart($variantId: ID!, $quantity: Int!) {\n    addItemToOrder(productVariantId: $variantId, quantity: $quantity) {\n      __typename\n      ... on Order {\n        totalQuantity\n      }\n      ... on InsufficientStockError {\n        quantityAvailable\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": types.AddToCartDocument,
    "\n  mutation AdjustLine($lineId: ID!, $quantity: Int!) {\n    adjustOrderLine(orderLineId: $lineId, quantity: $quantity) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": types.AdjustLineDocument,
    "\n  mutation RemoveLine($lineId: ID!) {\n    removeOrderLine(orderLineId: $lineId) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": types.RemoveLineDocument,
    "\n  mutation TransitionOrder($state: String!) {\n    transitionOrderToState(state: $state) {\n      __typename\n      ... on Order {\n        state\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": types.TransitionOrderDocument,
    "\n  query CheckoutOptions {\n    activeOrder {\n      ...CartOrder\n    }\n    activeCustomer {\n      id\n      firstName\n      lastName\n      emailAddress\n      phoneNumber\n      addresses {\n        fullName\n        streetLine1\n        streetLine2\n        city\n        province\n        postalCode\n        phoneNumber\n        defaultShippingAddress\n      }\n    }\n    eligibleShippingMethods {\n      id\n      name\n      description\n      priceWithTax\n    }\n    eligiblePaymentMethods {\n      code\n      name\n      description\n      isEligible\n    }\n  }\n": types.CheckoutOptionsDocument,
    "\n  mutation SetCustomerForOrder($input: CreateCustomerInput!) {\n    setCustomerForOrder(input: $input) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": types.SetCustomerForOrderDocument,
    "\n  mutation SetShippingAddress($input: CreateAddressInput!) {\n    setOrderShippingAddress(input: $input) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": types.SetShippingAddressDocument,
    "\n  mutation SetShippingMethod($ids: [ID!]!) {\n    setOrderShippingMethod(shippingMethodId: $ids) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": types.SetShippingMethodDocument,
    "\n  mutation CreateKonnectPayment {\n    createKonnectPaymentIntent\n  }\n": types.CreateKonnectPaymentDocument,
    "\n  mutation AddPayment($input: PaymentInput!) {\n    addPaymentToOrder(input: $input) {\n      __typename\n      ... on Order {\n        code\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": types.AddPaymentDocument,
    "\n  query OrderByCode($code: String!) {\n    orderByCode(code: $code) {\n      ...CartOrder\n    }\n  }\n": types.OrderByCodeDocument,
    "\n  fragment ProductSummary on Product {\n    id\n    name\n    slug\n    featuredAsset {\n      preview\n      customFields {\n        alt\n      }\n    }\n    customFields {\n      legacyId\n      ean13\n      urlCategory\n      quoteOnly\n    }\n    variants {\n      priceWithTax\n      customFields {\n        regularPrice\n      }\n    }\n  }\n": types.ProductSummaryFragmentDoc,
    "\n  fragment VariantSummary on ProductVariant {\n    id\n    priceWithTax\n    product {\n      ...ProductSummary\n    }\n  }\n": types.VariantSummaryFragmentDoc,
    "\n  fragment CollectionWithProducts on Collection {\n    id\n    name\n    slug\n    description\n    customFields {\n      legacyId\n    }\n    productVariants(options: { take: $take }) {\n      totalItems\n      items {\n        ...VariantSummary\n      }\n    }\n  }\n": types.CollectionWithProductsFragmentDoc,
    "\n  query ProductByLegacyId($legacyId: Float!) {\n    products(options: { take: 1, filter: { legacyId: { eq: $legacyId } } }) {\n      items {\n        ...ProductSummary\n        description\n        seo: customFields {\n          metaTitle\n          metaDescription\n        }\n        assets {\n          preview\n          customFields {\n            alt\n          }\n        }\n        facetValues {\n          id\n          name\n          facet {\n            id\n            name\n          }\n        }\n        collections {\n          id\n          name\n          slug\n          breadcrumbs {\n            id\n          }\n          customFields {\n            legacyId\n          }\n          parent {\n            name\n            slug\n            customFields {\n              legacyId\n            }\n          }\n        }\n        variants {\n          id\n          name\n          sku\n          priceWithTax\n          stockLevel\n          options {\n            name\n          }\n          customFields {\n            regularPrice\n            saleEndsAt\n          }\n        }\n      }\n    }\n  }\n": types.ProductByLegacyIdDocument,
    "\n  fragment CategoryLink on Collection {\n    id\n    name\n    slug\n    featuredAsset {\n      preview\n    }\n    customFields {\n      legacyId\n    }\n  }\n": types.CategoryLinkFragmentDoc,
    "\n  query CollectionByLegacyId($legacyId: Float!) {\n    collections(options: { take: 1, filter: { legacyId: { eq: $legacyId } } }) {\n      items {\n        id\n        name\n        slug\n        description\n        featuredAsset {\n          preview\n        }\n        customFields {\n          legacyId\n          metaTitle\n          metaDescription\n          filterFacetIds\n        }\n        parent {\n          ...CategoryLink\n          parent {\n            ...CategoryLink\n          }\n        }\n        children {\n          ...CategoryLink\n          position\n        }\n      }\n    }\n  }\n": types.CollectionByLegacyIdDocument,
    "\n  query Brands {\n    facets(options: { filter: { code: { eq: \"marque\" } } }) {\n      items {\n        values {\n          id\n          name\n          customFields {\n            legacyManufacturerId\n            description\n            metaTitle\n            metaDescription\n          }\n        }\n      }\n    }\n  }\n": types.BrandsDocument,
    "\n  query ListingFacets($input: SearchInput!) {\n    search(input: $input) {\n      totalItems\n      facetValues {\n        count\n        facetValue {\n          id\n          name\n          facet {\n            id\n            name\n          }\n        }\n      }\n    }\n  }\n": types.ListingFacetsDocument,
    "\n  query CategoryPage($input: SearchInput!) {\n    search(input: $input) {\n      totalItems\n      items {\n        productId\n        priceWithTax {\n          ... on SinglePrice {\n            value\n          }\n          ... on PriceRange {\n            min\n            max\n          }\n        }\n      }\n    }\n  }\n": types.CategoryPageDocument,
    "\n  query ProductsByIds($ids: [String!]!, $take: Int!) {\n    products(options: { take: $take, filter: { id: { in: $ids } } }) {\n      items {\n        ...ProductSummary\n      }\n    }\n  }\n": types.ProductsByIdsDocument,
    "\n  query CollectionBySlug($slug: String!, $take: Int!) {\n    collection(slug: $slug) {\n      ...CollectionWithProducts\n    }\n  }\n": types.CollectionBySlugDocument,
    "\n  query CollectionIdBySlug($slug: String!) {\n    collection(slug: $slug) {\n      id\n    }\n  }\n": types.CollectionIdBySlugDocument,
    "\n  query RankedProducts($options: ProductListOptions!) {\n    products(options: $options) {\n      totalItems\n      items {\n        ...ProductSummary\n      }\n    }\n  }\n": types.RankedProductsDocument,
    "\n  query LegacyImage($imageId: Int!) {\n    legacyImage(imageId: $imageId) {\n      preview\n    }\n  }\n": types.LegacyImageDocument,
    "\n  query LegacyRedirect($path: String!) {\n    legacyRedirect(path: $path) {\n      toPath\n      statusCode\n    }\n  }\n": types.LegacyRedirectDocument,
    "\n  mutation SubmitForm($input: SubmitFormInput!) {\n    submitForm(input: $input)\n  }\n": types.SubmitFormDocument,
    "\n  query SitemapProducts($skip: Int!, $take: Int!) {\n    products(options: { skip: $skip, take: $take }) {\n      totalItems\n      items {\n        slug\n        updatedAt\n        customFields {\n          legacyId\n          ean13\n          urlCategory\n        }\n      }\n    }\n  }\n": types.SitemapProductsDocument,
    "\n  query SitemapCollections($skip: Int!, $take: Int!) {\n    collections(options: { skip: $skip, take: $take }) {\n      items {\n        slug\n        updatedAt\n        customFields {\n          legacyId\n        }\n      }\n    }\n  }\n": types.SitemapCollectionsDocument,
    "\n  query CategoryTree {\n    collections(options: { topLevelOnly: true, take: 50, sort: { position: ASC } }) {\n      items {\n        id\n        name\n        slug\n        featuredAsset {\n          preview\n        }\n        customFields {\n          legacyId\n        }\n        children {\n          id\n          name\n          slug\n          featuredAsset {\n            preview\n          }\n          position\n          customFields {\n            legacyId\n          }\n        }\n      }\n    }\n  }\n": types.CategoryTreeDocument,
    "\n  query QuoteProduct($id: ID!) {\n    product(id: $id) {\n      id\n      name\n      variants {\n        id\n        name\n        sku\n      }\n    }\n  }\n": types.QuoteProductDocument,
    "\n  mutation RequestQuote($input: RequestQuoteInput!) {\n    requestQuote(input: $input)\n  }\n": types.RequestQuoteDocument,
    "\n  mutation RegisterWarranty($input: RegisterWarrantyInput!) {\n    registerWarranty(input: $input)\n  }\n": types.RegisterWarrantyDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment AccountAddress on Address {\n    id\n    fullName\n    streetLine1\n    streetLine2\n    city\n    province\n    postalCode\n    phoneNumber\n    defaultShippingAddress\n    defaultBillingAddress\n  }\n"): typeof import('./graphql').AccountAddressFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ActiveCustomer {\n    activeCustomer {\n      id\n      firstName\n      lastName\n      emailAddress\n      phoneNumber\n    }\n  }\n"): typeof import('./graphql').ActiveCustomerDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CustomerAddresses {\n    activeCustomer {\n      id\n      addresses {\n        ...AccountAddress\n      }\n    }\n  }\n"): typeof import('./graphql').CustomerAddressesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CustomerOrders($skip: Int!, $take: Int!) {\n    activeCustomer {\n      id\n      orders(\n        options: {\n          skip: $skip\n          take: $take\n          sort: { orderPlacedAt: DESC }\n          filter: { active: { eq: false } }\n        }\n      ) {\n        totalItems\n        items {\n          id\n          code\n          state\n          orderPlacedAt\n          totalQuantity\n          totalWithTax\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').CustomerOrdersDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Login($username: String!, $password: String!, $rememberMe: Boolean) {\n    login(username: $username, password: $password, rememberMe: $rememberMe) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"): typeof import('./graphql').LoginDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Logout {\n    logout {\n      success\n    }\n  }\n"): typeof import('./graphql').LogoutDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Register($input: RegisterCustomerInput!) {\n    registerCustomerAccount(input: $input) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"): typeof import('./graphql').RegisterDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation VerifyAccount($token: String!) {\n    verifyCustomerAccount(token: $token) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"): typeof import('./graphql').VerifyAccountDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RequestPasswordReset($emailAddress: String!) {\n    requestPasswordReset(emailAddress: $emailAddress) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"): typeof import('./graphql').RequestPasswordResetDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ResetPassword($token: String!, $password: String!) {\n    resetPassword(token: $token, password: $password) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"): typeof import('./graphql').ResetPasswordDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateCustomer($input: UpdateCustomerInput!) {\n    updateCustomer(input: $input) {\n      id\n    }\n  }\n"): typeof import('./graphql').UpdateCustomerDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdatePassword($currentPassword: String!, $newPassword: String!) {\n    updateCustomerPassword(currentPassword: $currentPassword, newPassword: $newPassword) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"): typeof import('./graphql').UpdatePasswordDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RequestEmailChange($password: String!, $newEmailAddress: String!) {\n    requestUpdateCustomerEmailAddress(password: $password, newEmailAddress: $newEmailAddress) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"): typeof import('./graphql').RequestEmailChangeDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ConfirmEmailChange($token: String!) {\n    updateCustomerEmailAddress(token: $token) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"): typeof import('./graphql').ConfirmEmailChangeDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateAddress($input: CreateAddressInput!) {\n    createCustomerAddress(input: $input) {\n      id\n    }\n  }\n"): typeof import('./graphql').CreateAddressDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetDefaultAddress($id: ID!) {\n    updateCustomerAddress(\n      input: { id: $id, defaultShippingAddress: true, defaultBillingAddress: true }\n    ) {\n      id\n    }\n  }\n"): typeof import('./graphql').SetDefaultAddressDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteAddress($id: ID!) {\n    deleteCustomerAddress(id: $id) {\n      success\n    }\n  }\n"): typeof import('./graphql').DeleteAddressDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment CartOrder on Order {\n    id\n    code\n    state\n    active\n    totalQuantity\n    subTotalWithTax\n    shippingWithTax\n    totalWithTax\n    customer {\n      id\n      firstName\n      lastName\n      emailAddress\n      phoneNumber\n    }\n    shippingAddress {\n      fullName\n      streetLine1\n      streetLine2\n      city\n      province\n      postalCode\n      phoneNumber\n    }\n    shippingLines {\n      priceWithTax\n      shippingMethod {\n        id\n        name\n      }\n    }\n    discounts {\n      description\n      amountWithTax\n    }\n    lines {\n      id\n      quantity\n      unitPriceWithTax\n      linePriceWithTax\n      featuredAsset {\n        preview\n      }\n      productVariant {\n        id\n        name\n        sku\n        product {\n          ...ProductSummary\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').CartOrderFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ActiveOrder {\n    activeOrder {\n      ...CartOrder\n    }\n  }\n"): typeof import('./graphql').ActiveOrderDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CartCount {\n    activeOrder {\n      totalQuantity\n    }\n  }\n"): typeof import('./graphql').CartCountDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddToCart($variantId: ID!, $quantity: Int!) {\n    addItemToOrder(productVariantId: $variantId, quantity: $quantity) {\n      __typename\n      ... on Order {\n        totalQuantity\n      }\n      ... on InsufficientStockError {\n        quantityAvailable\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"): typeof import('./graphql').AddToCartDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdjustLine($lineId: ID!, $quantity: Int!) {\n    adjustOrderLine(orderLineId: $lineId, quantity: $quantity) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"): typeof import('./graphql').AdjustLineDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveLine($lineId: ID!) {\n    removeOrderLine(orderLineId: $lineId) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"): typeof import('./graphql').RemoveLineDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TransitionOrder($state: String!) {\n    transitionOrderToState(state: $state) {\n      __typename\n      ... on Order {\n        state\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"): typeof import('./graphql').TransitionOrderDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CheckoutOptions {\n    activeOrder {\n      ...CartOrder\n    }\n    activeCustomer {\n      id\n      firstName\n      lastName\n      emailAddress\n      phoneNumber\n      addresses {\n        fullName\n        streetLine1\n        streetLine2\n        city\n        province\n        postalCode\n        phoneNumber\n        defaultShippingAddress\n      }\n    }\n    eligibleShippingMethods {\n      id\n      name\n      description\n      priceWithTax\n    }\n    eligiblePaymentMethods {\n      code\n      name\n      description\n      isEligible\n    }\n  }\n"): typeof import('./graphql').CheckoutOptionsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetCustomerForOrder($input: CreateCustomerInput!) {\n    setCustomerForOrder(input: $input) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"): typeof import('./graphql').SetCustomerForOrderDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetShippingAddress($input: CreateAddressInput!) {\n    setOrderShippingAddress(input: $input) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"): typeof import('./graphql').SetShippingAddressDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetShippingMethod($ids: [ID!]!) {\n    setOrderShippingMethod(shippingMethodId: $ids) {\n      __typename\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"): typeof import('./graphql').SetShippingMethodDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateKonnectPayment {\n    createKonnectPaymentIntent\n  }\n"): typeof import('./graphql').CreateKonnectPaymentDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddPayment($input: PaymentInput!) {\n    addPaymentToOrder(input: $input) {\n      __typename\n      ... on Order {\n        code\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"): typeof import('./graphql').AddPaymentDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query OrderByCode($code: String!) {\n    orderByCode(code: $code) {\n      ...CartOrder\n    }\n  }\n"): typeof import('./graphql').OrderByCodeDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProductSummary on Product {\n    id\n    name\n    slug\n    featuredAsset {\n      preview\n      customFields {\n        alt\n      }\n    }\n    customFields {\n      legacyId\n      ean13\n      urlCategory\n      quoteOnly\n    }\n    variants {\n      priceWithTax\n      customFields {\n        regularPrice\n      }\n    }\n  }\n"): typeof import('./graphql').ProductSummaryFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment VariantSummary on ProductVariant {\n    id\n    priceWithTax\n    product {\n      ...ProductSummary\n    }\n  }\n"): typeof import('./graphql').VariantSummaryFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment CollectionWithProducts on Collection {\n    id\n    name\n    slug\n    description\n    customFields {\n      legacyId\n    }\n    productVariants(options: { take: $take }) {\n      totalItems\n      items {\n        ...VariantSummary\n      }\n    }\n  }\n"): typeof import('./graphql').CollectionWithProductsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProductByLegacyId($legacyId: Float!) {\n    products(options: { take: 1, filter: { legacyId: { eq: $legacyId } } }) {\n      items {\n        ...ProductSummary\n        description\n        seo: customFields {\n          metaTitle\n          metaDescription\n        }\n        assets {\n          preview\n          customFields {\n            alt\n          }\n        }\n        facetValues {\n          id\n          name\n          facet {\n            id\n            name\n          }\n        }\n        collections {\n          id\n          name\n          slug\n          breadcrumbs {\n            id\n          }\n          customFields {\n            legacyId\n          }\n          parent {\n            name\n            slug\n            customFields {\n              legacyId\n            }\n          }\n        }\n        variants {\n          id\n          name\n          sku\n          priceWithTax\n          stockLevel\n          options {\n            name\n          }\n          customFields {\n            regularPrice\n            saleEndsAt\n          }\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').ProductByLegacyIdDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment CategoryLink on Collection {\n    id\n    name\n    slug\n    featuredAsset {\n      preview\n    }\n    customFields {\n      legacyId\n    }\n  }\n"): typeof import('./graphql').CategoryLinkFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CollectionByLegacyId($legacyId: Float!) {\n    collections(options: { take: 1, filter: { legacyId: { eq: $legacyId } } }) {\n      items {\n        id\n        name\n        slug\n        description\n        featuredAsset {\n          preview\n        }\n        customFields {\n          legacyId\n          metaTitle\n          metaDescription\n          filterFacetIds\n        }\n        parent {\n          ...CategoryLink\n          parent {\n            ...CategoryLink\n          }\n        }\n        children {\n          ...CategoryLink\n          position\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').CollectionByLegacyIdDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Brands {\n    facets(options: { filter: { code: { eq: \"marque\" } } }) {\n      items {\n        values {\n          id\n          name\n          customFields {\n            legacyManufacturerId\n            description\n            metaTitle\n            metaDescription\n          }\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').BrandsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ListingFacets($input: SearchInput!) {\n    search(input: $input) {\n      totalItems\n      facetValues {\n        count\n        facetValue {\n          id\n          name\n          facet {\n            id\n            name\n          }\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').ListingFacetsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CategoryPage($input: SearchInput!) {\n    search(input: $input) {\n      totalItems\n      items {\n        productId\n        priceWithTax {\n          ... on SinglePrice {\n            value\n          }\n          ... on PriceRange {\n            min\n            max\n          }\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').CategoryPageDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProductsByIds($ids: [String!]!, $take: Int!) {\n    products(options: { take: $take, filter: { id: { in: $ids } } }) {\n      items {\n        ...ProductSummary\n      }\n    }\n  }\n"): typeof import('./graphql').ProductsByIdsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CollectionBySlug($slug: String!, $take: Int!) {\n    collection(slug: $slug) {\n      ...CollectionWithProducts\n    }\n  }\n"): typeof import('./graphql').CollectionBySlugDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CollectionIdBySlug($slug: String!) {\n    collection(slug: $slug) {\n      id\n    }\n  }\n"): typeof import('./graphql').CollectionIdBySlugDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RankedProducts($options: ProductListOptions!) {\n    products(options: $options) {\n      totalItems\n      items {\n        ...ProductSummary\n      }\n    }\n  }\n"): typeof import('./graphql').RankedProductsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LegacyImage($imageId: Int!) {\n    legacyImage(imageId: $imageId) {\n      preview\n    }\n  }\n"): typeof import('./graphql').LegacyImageDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LegacyRedirect($path: String!) {\n    legacyRedirect(path: $path) {\n      toPath\n      statusCode\n    }\n  }\n"): typeof import('./graphql').LegacyRedirectDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SubmitForm($input: SubmitFormInput!) {\n    submitForm(input: $input)\n  }\n"): typeof import('./graphql').SubmitFormDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SitemapProducts($skip: Int!, $take: Int!) {\n    products(options: { skip: $skip, take: $take }) {\n      totalItems\n      items {\n        slug\n        updatedAt\n        customFields {\n          legacyId\n          ean13\n          urlCategory\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').SitemapProductsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SitemapCollections($skip: Int!, $take: Int!) {\n    collections(options: { skip: $skip, take: $take }) {\n      items {\n        slug\n        updatedAt\n        customFields {\n          legacyId\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').SitemapCollectionsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CategoryTree {\n    collections(options: { topLevelOnly: true, take: 50, sort: { position: ASC } }) {\n      items {\n        id\n        name\n        slug\n        featuredAsset {\n          preview\n        }\n        customFields {\n          legacyId\n        }\n        children {\n          id\n          name\n          slug\n          featuredAsset {\n            preview\n          }\n          position\n          customFields {\n            legacyId\n          }\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').CategoryTreeDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query QuoteProduct($id: ID!) {\n    product(id: $id) {\n      id\n      name\n      variants {\n        id\n        name\n        sku\n      }\n    }\n  }\n"): typeof import('./graphql').QuoteProductDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RequestQuote($input: RequestQuoteInput!) {\n    requestQuote(input: $input)\n  }\n"): typeof import('./graphql').RequestQuoteDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RegisterWarranty($input: RegisterWarrantyInput!) {\n    registerWarranty(input: $input)\n  }\n"): typeof import('./graphql').RegisterWarrantyDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
