/*
  Presenter-only notes for the identity provider journey. Never shown on a
  client-facing screen. The provider is never named.
*/
export const identityPresenterNotes: { title: string; body: string }[] = [
  {
    title: 'Return to our page after the check',
    body: 'Whether the certified identity provider returns the person to the Evidence One page after its journey is still to be confirmed with the provider. The return shown in the demo is a simulated placeholder.',
  },
  {
    title: 'Where the chip step sits',
    body: 'The demo places the chip step straight after the document capture, inside the provider journey. The exact position is still to be confirmed with the provider.',
  },
  {
    title: 'eVisa holders',
    body: 'The certified identity provider checks an eVisa directly with the Home Office (provider answer of 23 October). An eVisa is an accepted Option 1 document on the same route.',
  },
  {
    title: 'No smartphone or tablet',
    body: 'A person without a smartphone or tablet is offered an Option 2 request to the ACSP. Raised by Halil on 23 October; the client has not answered, so it carries a Pending your decision badge.',
  },
  {
    title: 'Chip not read',
    body: 'Companies House replied on 13 October that no technology or NFC is mandated, and the client determined that the ACSP decides. The demo records "No chip read" and gives the reviewer a Flag and a Mandatory decision. This is a design interpretation; the wording is to be confirmed with the client.',
  },
]
