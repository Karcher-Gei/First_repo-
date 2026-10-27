/** Minimal client for Vendure's Admin API, signed in as the superadmin. */
export interface VendureAdminConfig {
  url: string;
  username: string;
  password: string;
}

export function vendureConfigFromEnv(): VendureAdminConfig {
  const { VENDURE_ADMIN_API_URL, VENDURE_ADMIN_USERNAME, VENDURE_ADMIN_PASSWORD } = process.env;
  if (!VENDURE_ADMIN_API_URL || !VENDURE_ADMIN_USERNAME || !VENDURE_ADMIN_PASSWORD) {
    throw new Error(
      'VENDURE_ADMIN_API_URL, VENDURE_ADMIN_USERNAME and VENDURE_ADMIN_PASSWORD must be set (see .env.example)',
    );
  }
  return {
    url: VENDURE_ADMIN_API_URL,
    username: VENDURE_ADMIN_USERNAME,
    password: VENDURE_ADMIN_PASSWORD,
  };
}

interface GraphQlBody<T> {
  data?: T;
  errors?: { message: string }[];
}

export class VendureAdmin {
  private token = '';

  private constructor(private readonly cfg: VendureAdminConfig) {}

  static async connect(cfg: VendureAdminConfig): Promise<VendureAdmin> {
    const admin = new VendureAdmin(cfg);
    const { login } = await admin.gql<{ login: { __typename: string; message?: string } }>(
      `mutation ($u: String!, $p: String!) {
        login(username: $u, password: $p) { __typename ... on ErrorResult { message } }
      }`,
      { u: cfg.username, p: cfg.password },
    );
    if (login.__typename !== 'CurrentUser') {
      throw new Error(`Vendure login failed: ${login.message ?? login.__typename}`);
    }
    return admin;
  }

  /** Runs a query or mutation; GraphQL errors throw. */
  async gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    return this.send<T>(JSON.stringify({ query, variables }), {
      'content-type': 'application/json',
    });
  }

  /** Uploads one image as an Asset; product images carry their PrestaShop image id and alt text. */
  async uploadAsset(
    file: Uint8Array,
    fileName: string,
    customFields: { legacyImageId?: number; alt?: string | null } = {},
  ): Promise<string> {
    const form = new FormData();
    form.append(
      'operations',
      JSON.stringify({
        query: `mutation ($file: Upload!, $customFields: CreateAssetCustomFieldsInput) {
          createAssets(input: [{ file: $file, customFields: $customFields }]) {
            __typename ... on Asset { id } ... on ErrorResult { message }
          }
        }`,
        variables: { file: null, customFields },
      }),
    );
    form.append('map', JSON.stringify({ 0: ['variables.file'] }));
    form.append('0', new Blob([file], { type: 'image/jpeg' }), fileName);
    const { createAssets } = await this.send<{
      createAssets: { __typename: string; id?: string; message?: string }[];
    }>(form, { 'apollo-require-preflight': 'true' });
    const asset = createAssets[0];
    if (!asset?.id) {
      throw new Error(`Upload of ${fileName} failed: ${asset?.message ?? 'no result'}`);
    }
    return asset.id;
  }

  /** Every item of a paginated list query; `query` takes $skip and $take and returns { items, totalItems }. */
  async all<T>(
    query: string,
    pick: (data: never) => { items: T[]; totalItems: number },
  ): Promise<T[]> {
    const items: T[] = [];
    const take = 500;
    for (let skip = 0; ; skip += take) {
      const page = pick(await this.gql<never>(query, { skip, take }));
      items.push(...page.items);
      if (items.length >= page.totalItems || page.items.length === 0) {
        return items;
      }
    }
  }

  private async send<T>(body: string | FormData, headers: Record<string, string>): Promise<T> {
    const response = await fetch(this.cfg.url, {
      method: 'POST',
      headers: { ...headers, ...(this.token ? { authorization: `Bearer ${this.token}` } : {}) },
      body,
    });
    this.token = response.headers.get('vendure-auth-token') ?? this.token;
    const json = (await response.json().catch(() => ({}))) as GraphQlBody<T>;
    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join('; '));
    }
    if (!response.ok || !json.data) {
      throw new Error(`Vendure Admin API responded ${response.status}`);
    }
    return json.data;
  }
}

/** Throws when a mutation returned one of Vendure's ErrorResult types instead of the entity. */
export function ok<T extends { __typename?: string; message?: string }>(
  result: T,
  what: string,
): T {
  if (result.__typename && result.__typename.endsWith('Error')) {
    throw new Error(`${what}: ${result.message ?? result.__typename}`);
  }
  return result;
}
