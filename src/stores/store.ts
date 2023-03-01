interface StoreCallback<T> {
  id: symbol
  callback: (data: T) => void
}

export class Store<T> {
  private _callbacks: Array<StoreCallback<T>> = []

  constructor(private _value: T) {}

  set(value: T) {
    this._value = value

    this._propagate(value)
  }

  get(): T {
    return this._value
  }

  subscribe(callback: (data: T) => void): () => void {
    // eslint-disable-next-line symbol-description
    const callbackId = Symbol()

    this._callbacks.push({ id: callbackId, callback })

    callback(this._value)

    return () => {
      this._callbacks = this._callbacks.filter(
        ({ id }: StoreCallback<T>) => id !== callbackId
      )
    }
  }

  private _propagate(data: T) {
    this._callbacks.forEach(({ callback }: StoreCallback<T>) => {
      callback(data)
    })
  }
}
