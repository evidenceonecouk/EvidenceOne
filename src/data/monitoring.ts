import type { MonitoringState } from '@/types/domain'

/*
  ACSP status monitoring seed. Companies House publishes files, there is no
  API: the platform checks both files every two weeks and an administrator
  confirms every name match. Dates are fixed because they are data.
*/
export function seedMonitoring(): MonitoringState {
  return {
    lastFortnightlyCheckAt: '2026-10-05T07:30:00.000Z',
    nameMatches: [
      {
        id: 'NM-2026-014',
        acspId: 'acsp-northbank',
        source: 'ceased_suspended_list',
        listedName: 'NORTHBANK COMPLIANCE LIMITED',
        platformName: 'Northbank Compliance Ltd',
        status: 'confirmed',
        confirmedBy: 'Marcus Adeyemi, Platform Administrator',
        confirmedAt: '2026-10-05T09:12:00.000Z',
      },
      {
        id: 'NM-2026-015',
        acspId: 'acsp-ashdown',
        source: 'opt_in_list',
        listedName: 'ASHDOWN TRUST SERVICES (LEICESTER) LIMITED',
        platformName: 'Ashdown Trust Services Ltd',
        status: 'to_confirm',
      },
    ],
    yearlyUploads: [
      {
        id: 'YU-2025-001',
        uploadedAt: '2025-10-06T10:20:00.000Z',
        uploadedBy: 'Marcus Adeyemi, Platform Administrator',
        fileName: 'ch-acsp-opt-in-list-2025-10.csv',
        rows: 1840,
        matched: 3,
        notFoundAcspIds: [],
      },
    ],
  }
}
