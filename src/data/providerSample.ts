/*
  A fictional provider session in the same raw shape the live provider returns,
  shown when no live session is configured. Dmytro Shevchenko is a seed person
  (src/data/people.ts); his media are the demo's vector illustrations, never
  photographs, so every image link here is empty.
*/
const t0 = Date.parse('2026-10-26T15:41:13Z')
const at = (s: number) => t0 + s * 1000
const device = { device_model: 'iPhone', browser_family: 'Mobile Safari' }
const location = {
  ip_city: 'Dubai',
  ip_country: 'United Arab Emirates',
  ip_address: '203.0.113.48',
}

export const sampleDecision = {
  session_id: '6f1d2c84-3b7a-4e19-a0c5-92d1e4b7f310',
  session_number: 1,
  session_kind: 'user',
  status: 'Approved',
  created_at: '2026-10-26T15:41:13Z',
  vendor_data: 'EO-2026-000137',
  workflow_type: 'Option 1, web route',
  contact_details: { email: 'dmytro@blueharbour.example', phone: null },
  id_verifications: [
    {
      node_id: 'feature_ocr_1',
      status: 'Approved',
      document_type: 'Passport',
      document_number: 'FH290418',
      personal_number: '19860412-01837',
      issuing_state: 'UKR',
      issuing_state_name: 'Ukraine',
      nationality: 'UKR',
      first_name: 'Dmytro',
      last_name: 'Shevchenko',
      full_name: 'Dmytro Shevchenko',
      date_of_birth: '1986-04-12',
      gender: 'M',
      place_of_birth: 'Kyiv, UKR',
      date_of_issue: '2021-06-20',
      expiration_date: '2031-06-20',
      extra_fields: {
        full_name_non_latin: 'Дмитро Шевченко',
        first_name_non_latin: 'Дмитро',
        last_name_non_latin: 'Шевченко',
        place_of_birth_non_latin: 'м. Київ',
      },
      mrz: {
        mrz_string:
          'P<UKRSHEVCHENKO<<DMYTRO<<<<<<<<<<<<<<<<<<<<<\nFH290418<1UKR8604127M3106205198604120183754',
      },
      front_image_quality_score: { overall_score: 91.4 },
      document_liveness: {
        portrait_replace: { score: 97.2, bucket: 'approve' },
        printed_copy: { score: 93.8, bucket: 'approve' },
        screen_replay: { score: 99.6, bucket: 'approve' },
      },
      warnings: [],
    },
  ],
  nfc_verifications: [
    {
      node_id: 'feature_nfc_1',
      status: 'Approved',
      is_nfc_skipped: false,
      skip_reason: null,
      authenticity: { sod_integrity: true, dg_integrity: true },
      certificate_summary: {
        issuer: 'CSCA Ukraine (specimen)',
        not_valid_after: '2031-02-18',
      },
      warnings: [],
    },
  ],
  liveness_checks: [
    {
      node_id: 'feature_liveness_1',
      status: 'Approved',
      method: 'PASSIVE',
      score: 94.97,
      face_quality: 99.9,
      face_luminance: 57.3,
      age_estimation: 40.2,
      warnings: [],
    },
  ],
  face_matches: [
    {
      node_id: 'feature_face_match_1',
      status: 'Approved',
      score: 96.59,
      warnings: [],
    },
  ],
  ip_analyses: [
    {
      node_id: 'feature_ip_1',
      status: 'Approved',
      platform: 'mobile',
      device_brand: 'Apple',
      device_model: 'iPhone',
      os_family: 'iOS 18.7',
      browser_family: 'Mobile Safari 27.0.1',
      device_fingerprint: 'N-1nD7Frh7Ex7W37W7pDmA',
      ip_address: '203.0.113.48',
      ip_city: 'Dubai',
      ip_state: 'Dubai',
      ip_country: 'United Arab Emirates',
      ip_country_code: 'AE',
      latitude: 25.1865,
      longitude: 55.2635,
      isp: 'Emirates Telecommunications',
      is_vpn_or_tor: false,
      is_data_center: false,
      time_zone: 'Asia/Dubai',
      time_zone_offset: '+0400',
      user_agent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0.1 Mobile/15E148 Safari/604.1',
      accept_language: 'uk-UA,uk;q=0.9,en-GB;q=0.8',
      warnings: [
        {
          feature: 'IP_ANALYSIS',
          risk: 'IP_COUNTRY_MISMATCH',
          log_type: 'information',
          short_description:
            'Country from document does not match country from IP',
          long_description:
            'The passport was issued by Ukraine and the session ran from an IP address in the United Arab Emirates. This matches the declared residence and is shown for the reviewer to note.',
        },
      ],
    },
  ],
  events: [
    {
      event_type: 'WORKFLOW_STATUS_NODE_REACHED',
      sent_at: at(167),
      details: { resolved_session_status: 'Approved' },
    },
    {
      event_type: 'STEP_CHANGED',
      sent_at: at(166),
      details: { from: 'Face match', to: 'Device and IP analysis' },
    },
    {
      event_type: 'STEP_CHANGED',
      sent_at: at(165),
      details: { from: 'Liveness', to: 'Face match' },
    },
    {
      event_type: 'VALID_FILE_SUBMITTED',
      title: 'Valid file submitted',
      sent_at: at(150),
      component: 'Face camera',
      feature_step: 'Liveness, passive check',
      device,
      location,
    },
    {
      event_type: 'STEP_CHANGED',
      sent_at: at(133),
      details: { from: 'Chip read', to: 'Liveness' },
    },
    {
      event_type: 'CHIP_READ',
      title: 'Chip read',
      sent_at: at(118),
      component: "Identity provider's chip reader",
      feature_step: 'Chip, passport',
      device,
      location,
    },
    {
      event_type: 'FILE_UPLOADED',
      title: 'Document photo uploaded',
      sent_at: at(88),
      component: 'Document camera',
      feature_step: 'Identity document, photo page',
      device,
      location,
    },
    {
      event_type: 'INVALID_FILE_SUBMITTED',
      title: 'Invalid file submitted',
      sent_at: at(47),
      component: 'Document camera',
      feature_step: 'Identity document, photo page (glare)',
      device,
      location,
    },
    {
      event_type: 'STEP_CHANGED',
      sent_at: at(2),
      details: { from: 'Start', to: 'Identity document' },
    },
  ],
}
