const ROSTER: readonly string[] = [
  'johndoe',
  'alex',
  'ed',
  'maya',
  'priya',
  'tomas',
  'lucia',
  'kai',
  'rosa',
  'john',
  'marek',
  'sara',
  'viktor',
  'jana',
];

export function hasAccount(nickName: string): boolean {
  return ROSTER.includes(nickName);
}
