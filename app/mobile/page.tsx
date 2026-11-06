import type { Metadata } from 'next';
import OriginalSite from '@/components/original-site';
export const metadata:Metadata={title:"الويب وتطبيق الجوال"};
export default function Page(){return <OriginalSite view="mobile" />;}
