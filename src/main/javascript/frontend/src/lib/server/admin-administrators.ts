import { apiGet } from '$lib/server/api';

type AdministratorApiRow = {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  second_last_name?: string | null;
  usfq_email?: string | null;
  personal_email?: string | null;
};

type AdministratorListResponse = {
  data?: AdministratorApiRow[];
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
};

export type AdministratorOption = {
  id: number;
  nombres: string;
  usfq_email: string | null;
  label: string;
};

function buildAdministratorName(administrator: AdministratorApiRow) {
  return [
    administrator.first_name,
    administrator.middle_name,
    administrator.last_name,
    administrator.second_last_name,
  ]
    .filter((value) => typeof value === 'string' && value.trim().length > 0)
    .join(' ');
}

export async function loadAdministratorOptions(accessToken: string): Promise<AdministratorOption[]> {
  const response = await apiGet<AdministratorListResponse>('/api/admin/administrators?limit=200', accessToken);
  if (!response.ok) return [];

  return (response.data?.data ?? []).map((administrator) => {
    const nombres = buildAdministratorName(administrator);
    const institutionalEmail = administrator.usfq_email?.trim() || null;
    const fallbackEmail = administrator.personal_email?.trim() || null;
    const email = institutionalEmail || fallbackEmail;

    return {
      id: administrator.id,
      nombres,
      usfq_email: institutionalEmail,
      label: email ? `${nombres} · ${email}` : nombres,
    };
  });
}
