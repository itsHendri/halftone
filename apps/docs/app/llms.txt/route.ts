import { kitLlmsSection, siteLlmsHeader } from '@/lib/llms';
import { docsLlms } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  const body = [siteLlmsHeader(), kitLlmsSection('mobile', 'Native kit'), kitLlmsSection('web', 'Web kit'), await docsLlms.index()].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
