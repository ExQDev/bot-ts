import { CallbackProps } from "@/types"

export default async function logout({db, user}: CallbackProps) {
  console.log(process.env.OAUTH)
  return [ process.env.OAUTH ]
}