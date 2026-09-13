import { Metadata } from 'next';
import SettingsClient from './SettingsClient';

export const metadata: Metadata = {
  title: 'Operator Settings | ZEX MILITARY',
};

export default function SettingsPage() {
  return <SettingsClient />;
}
