import { func, object } from "../../../decorators/decorators.ts"

@object()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class MultiArgs {
  @func()
  compute(a: number, b: number, c: number): number {
    return a * b + c
  }
}
