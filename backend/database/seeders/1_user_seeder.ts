import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

const PASSWORD = 'chatflow123'

const ROSTER: readonly (readonly [nickName: string, firstName: string, lastName: string])[] = [
  ['johndoe', 'John', 'Doe'],
  ['alex', 'Alex', 'Novák'],
  ['ed', 'Ed', 'Bartoš'],
  ['maya', 'Maya', 'Ferreira'],
  ['priya', 'Priya', 'Raman'],
  ['tomas', 'Tomáš', 'Gajdoš'],
  ['lucia', 'Lucia', 'Bíla'],
  ['kai', 'Kai', 'Lindberg'],
  ['rosa', 'Rosa', 'Iglesias'],
  ['john', 'John', 'Petrisko'],
  ['marek', 'Marek', 'Dvořák'],
  ['sara', 'Sara', 'Lindqvist'],
  ['viktor', 'Viktor', 'Šimko'],
  ['jana', 'Jana', 'Kovaľová'],
]

export default class extends BaseSeeder {
  async run() {
    await User.updateOrCreateMany(
      'nickName',
      ROSTER.map(([nickName, firstName, lastName]) => ({
        nickName,
        firstName,
        lastName,
        email: `${nickName}@northwind.team`,
        password: PASSWORD,
      }))
    )
  }
}
