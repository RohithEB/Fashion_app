/// Immutable money value object stored in **minor units** (e.g. cents) to avoid
/// floating-point rounding. Ported from the Flutter `Money`.
export class Money {
  readonly minorUnits: number;
  readonly currency: string;

  constructor(minorUnits: number, currency = 'USD') {
    this.minorUnits = minorUnits;
    this.currency = currency;
  }

  static zero(currency = 'USD'): Money {
    return new Money(0, currency);
  }

  static fromMajor(amount: number, currency = 'USD'): Money {
    return new Money(Math.round(amount * 100), currency);
  }

  static fromJson(json: any): Money {
    return new Money(Math.trunc(json.minorUnits as number), (json.currency as string) ?? 'USD');
  }

  get major(): number {
    return this.minorUnits / 100;
  }

  plus(other: Money): Money {
    return new Money(this.minorUnits + other.minorUnits, this.currency);
  }

  times(qty: number): Money {
    return new Money(this.minorUnits * qty, this.currency);
  }

  percent(pct: number): Money {
    return new Money(Math.round(this.minorUnits * pct), this.currency);
  }

  /// Formatted for display. INR uses the Indian numbering system with whole
  /// rupees; other currencies use Western grouping with 2 decimals.
  get formatted(): string {
    const symbol =
      this.currency === 'USD'
        ? '$'
        : this.currency === 'EUR'
          ? '€'
          : this.currency === 'GBP'
            ? '£'
            : this.currency === 'INR'
              ? '₹'
              : `${this.currency} `;
    if (this.currency === 'INR') {
      return `${symbol}${Money.groupIndian(Math.round(this.major))}`;
    }
    const parts = this.major.toFixed(2).split('.');
    const intPart = parts[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
    return `${symbol}${intPart}.${parts[1]}`;
  }

  /// Indian digit grouping: last 3 digits, then groups of 2.
  static groupIndian(value: number): string {
    const neg = value < 0;
    let s = Math.abs(value).toString();
    if (s.length > 3) {
      const last3 = s.substring(s.length - 3);
      let rest = s.substring(0, s.length - 3);
      const groups: string[] = [];
      while (rest.length > 2) {
        groups.unshift(rest.substring(rest.length - 2));
        rest = rest.substring(0, rest.length - 2);
      }
      if (rest.length > 0) groups.unshift(rest);
      s = `${groups.join(',')},${last3}`;
    }
    return neg ? `-${s}` : s;
  }

  equals(other: Money): boolean {
    return this.minorUnits === other.minorUnits && this.currency === other.currency;
  }
}
