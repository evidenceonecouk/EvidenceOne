import type { Person } from '@/types/domain'

/*
  How each fictional person is drawn in the app's camera and document mockups.
  These are vector illustrations, never photographs of real people. `sex` is
  only used for the sex field printed on the specimen documents.
*/
export type HairStyle = 'crop' | 'short' | 'bob' | 'lob' | 'long' | 'bun'

export interface PortraitLook {
  sex: 'F' | 'M'
  skin: string
  hair: string
  style: HairStyle
  beard?: boolean
  iris: string
  top: string
  /** Lighter colour towards the ends of longer hair. */
  hairEnds?: string
  lip?: string
  /** Cheek colour strength, 0 to 1. */
  blush?: number
  freckles?: boolean
  slimFace?: boolean
}

export const portraits: Record<string, PortraitLook> = {
  'p-margaret': {
    sex: 'F',
    skin: '#efd3c0',
    hair: '#cfccc6',
    style: 'bob',
    iris: '#4f6474',
    top: '#3a3f45',
  },
  'p-lucy': {
    sex: 'F',
    skin: '#f1d2b9',
    hair: '#6b4a32',
    style: 'long',
    iris: '#4a3a2c',
    top: '#5c636a',
  },
  'p-thomas': {
    sex: 'M',
    skin: '#ebc7aa',
    hair: '#4a3426',
    style: 'short',
    iris: '#4f6474',
    top: '#2f3640',
  },
  'p-priya': {
    sex: 'F',
    skin: '#bd8763',
    hair: '#1f1a17',
    style: 'long',
    iris: '#2e2019',
    top: '#3d4248',
  },
  'p-anna': {
    sex: 'F',
    skin: '#f3d9c9',
    hair: '#b08852',
    hairEnds: '#dcc08b',
    style: 'lob',
    iris: '#5687b0',
    top: '#17181a',
    lip: '#c4716c',
    blush: 0.15,
    freckles: true,
    slimFace: true,
  },
  'p-sofia': {
    sex: 'F',
    skin: '#f3d8c5',
    hair: '#cdaa72',
    style: 'long',
    iris: '#5a7287',
    top: '#4a5058',
  },
  'p-marcus': {
    sex: 'M',
    skin: '#e9c4a8',
    hair: '#8b8681',
    style: 'short',
    beard: true,
    iris: '#4a3a2c',
    top: '#292d31',
  },
  'p-aidan': {
    sex: 'M',
    skin: '#f1d0ba',
    hair: '#9c4f2a',
    style: 'short',
    iris: '#4f6474',
    top: '#3a3f45',
  },
  'p-fiona': {
    sex: 'F',
    skin: '#efcfb7',
    hair: '#7b3f24',
    style: 'bob',
    iris: '#4f6a4f',
    top: '#5c636a',
  },
  'p-grace': {
    sex: 'F',
    skin: '#8f5d42',
    hair: '#2a1f1a',
    style: 'bun',
    iris: '#2e2019',
    top: '#3a3f45',
  },
  'p-nadia': {
    sex: 'F',
    skin: '#d8ab8a',
    hair: '#2e221c',
    style: 'long',
    iris: '#3b2a20',
    top: '#2b2f36',
  },
  'p-imogen': {
    sex: 'F',
    skin: '#f0d2bd',
    hair: '#4f3829',
    style: 'bob',
    iris: '#4a3a2c',
    top: '#4a5058',
  },
  'p-samuel': {
    sex: 'M',
    skin: '#c9966f',
    hair: '#2b211b',
    style: 'short',
    iris: '#2e2019',
    top: '#2f3640',
  },
  'p-hannah': {
    sex: 'F',
    skin: '#f2d4c0',
    hair: '#8a6a48',
    style: 'long',
    iris: '#4f6474',
    top: '#3d4248',
  },
}

const skins = ['#f1d2b9', '#e3b896', '#c9966f', '#9a6648', '#7a4d35']
const hairs = ['#2b211b', '#4f3829', '#6b4a32', '#8a6a48', '#1f1a17']

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

/** The look for a person, with a stable fallback for people created during the demo. */
export function portraitFor(
  person: Pick<Person, 'id' | 'title'>,
): PortraitLook {
  const known = portraits[person.id]
  if (known) return known
  const h = hash(person.id)
  const sex = person.title === 'Mr' ? 'M' : 'F'
  return {
    sex,
    skin: skins[h % skins.length],
    hair: hairs[(h >> 3) % hairs.length],
    style:
      sex === 'M'
        ? h % 2
          ? 'short'
          : 'crop'
        : (['bob', 'long', 'bun'] as const)[h % 3],
    iris: '#3b2a20',
    top: '#3a3f45',
  }
}
