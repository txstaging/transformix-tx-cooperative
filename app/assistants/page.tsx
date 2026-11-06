import type { Metadata } from 'next';
import OriginalSite from '@/components/original-site';
export const metadata:Metadata={title:"المساعدان الذكيان"};
export default function Page(){return <OriginalSite view="assistants" />;}
