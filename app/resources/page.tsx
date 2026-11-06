import type { Metadata } from 'next';
import OriginalSite from '@/components/original-site';
export const metadata:Metadata={title:"الأسئلة الشائعة"};
export default function Page(){return <OriginalSite view="resources" />;}
