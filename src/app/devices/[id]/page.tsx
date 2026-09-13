import { Metadata } from 'next';
import DeviceDetailClient from './DeviceDetailClient';

export const metadata: Metadata = {
  title: 'Device Diagnostics | ZEX MILITARY',
};

export default function DevicePage({ params }: { params: { id: string } }) {
  return <DeviceDetailClient id={params.id} />;
}
