/** A route param as a single string (`undefined` and arrays included). */
export function paramString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.join('');
  return value ?? '';
}

/** The access code from route params, joined and without whitespace. */
export function normalizeInviteCode(value: string | string[] | undefined): string {
  return paramString(value).replace(/\s+/g, '');
}

/** Route params arrive as a string, an array (repeated key) or nothing. */
export type InviteParam = string | string[] | undefined;

export type InviteDetails = {
  name?: InviteParam;
  address?: InviteParam;
  date?: InviteParam;
  timeframe?: InviteParam;
  code: InviteParam;
};

/** Text for the mobile share sheet. */
export function inviteShareMessage({
  name,
  address,
  date,
  timeframe,
  code,
}: InviteDetails): string {
  return `You're invited!\n\nName: ${name}\nAddress: ${address}\nDate: ${date}\nTime: ${timeframe}\nCode: ${code}`;
}

/** Text for web sharing (Web Share API, social links and email); empty details are left out. */
export function inviteShareText({ name, address, date, timeframe, code }: InviteDetails): string {
  const parts: string[] = [];
  if (name) parts.push(`Name: ${name}`);
  if (address) parts.push(`Address: ${address}`);
  if (date) parts.push(`Date: ${date}`);
  if (timeframe) parts.push(`Timeframe: ${timeframe}`);
  parts.push(`Access code: ${code}`);
  return parts.join('\n');
}
