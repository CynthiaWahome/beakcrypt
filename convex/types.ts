import HttpStatus from "http-status";

export type Success<T> = {
  readonly data: T;
  readonly status: number;
  readonly error?: never;
  readonly code?: never;
};

export type Failure = {
  readonly data?: never;
  readonly code: string;
  readonly error: string;
  readonly status: number;
};

export type Result<T> = Success<T> | Failure;

export const success = <T>(
  data: T,
  status: number = HttpStatus.OK,
): Success<T> => ({ status, data });

export const failure = (
  status: number,
  code: string,
  error: string,
): Failure => ({ status, code, error });

export const isFailure = <T>(result: Result<T>): result is Failure =>
  result.status >= HttpStatus.BAD_REQUEST;

export const isSuccess = <T>(result: Result<T>): result is Success<T> =>
  result.status < HttpStatus.BAD_REQUEST;

export { HttpStatus };
