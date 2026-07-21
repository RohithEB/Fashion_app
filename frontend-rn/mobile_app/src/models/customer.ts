/// Onboarding choice lists served by the backend (`GET /api/customers/options`).
export class OnboardingOptions {
  readonly genders: string[];
  readonly ageRanges: string[];
  readonly personalities: string[];

  constructor(init: { genders: string[]; ageRanges: string[]; personalities: string[] }) {
    this.genders = init.genders;
    this.ageRanges = init.ageRanges;
    this.personalities = init.personalities;
  }

  static fromJson(json: any): OnboardingOptions {
    const list = (key: string): string[] => ((json[key] as any[]) ?? []).map((e) => `${e}`);
    return new OnboardingOptions({
      genders: list('genders'),
      ageRanges: list('ageRanges'),
      personalities: list('personalities'),
    });
  }

  static readonly empty = new OnboardingOptions({ genders: [], ageRanges: [], personalities: [] });
}

export interface CustomerFields {
  id: string;
  name?: string;
  mobile?: string;
  gender?: string;
  ageRange?: string;
  personality?: string;
  currentOutfit?: string;
  styling?: string;
  wearingColor?: string;
  occasion?: string;
  dateOfBirth?: string; // ISO string
  occupation?: string;
  fashionStyles?: string[];
  favoriteColors?: string[];
  preferredFit?: string;
  topSize?: string;
  bottomSize?: string;
  shoeSize?: string;
  budgetRange?: string;
  preferredBrands?: string[];
  favoriteCategories?: string[];
  preferredFabrics?: string[];
  notes?: string;
  isRepeatCustomer?: boolean;
  shoppingFor?: string;
  familySize?: number;
  familyMembers?: string[];
  boysCount?: number;
  girlsCount?: number;
  childAgeRanges?: string[];
}

/// A captured customer/guest for the current shopping session. Ported 1:1 from
/// the Flutter `Customer` (all fields optional except id).
export class Customer {
  readonly id: string;
  readonly name?: string;
  readonly mobile?: string;
  readonly dateOfBirth?: string;
  readonly gender?: string;
  readonly ageRange?: string;
  readonly occupation?: string;
  readonly fashionStyles: string[];
  readonly favoriteColors: string[];
  readonly preferredFit?: string;
  readonly topSize?: string;
  readonly bottomSize?: string;
  readonly shoeSize?: string;
  readonly preferredBrands: string[];
  readonly budgetRange?: string;
  readonly occasion?: string;
  readonly favoriteCategories: string[];
  readonly preferredFabrics: string[];
  readonly personality?: string;
  readonly isRepeatCustomer: boolean;
  readonly shoppingFor?: string;
  readonly familySize?: number;
  readonly familyMembers: string[];
  readonly boysCount?: number;
  readonly girlsCount?: number;
  readonly childAgeRanges: string[];
  readonly currentOutfit?: string;
  readonly styling?: string;
  readonly wearingColor?: string;
  readonly notes?: string;

  constructor(f: CustomerFields) {
    this.id = f.id;
    this.name = f.name;
    this.mobile = f.mobile;
    this.dateOfBirth = f.dateOfBirth;
    this.gender = f.gender;
    this.ageRange = f.ageRange;
    this.occupation = f.occupation;
    this.fashionStyles = f.fashionStyles ?? [];
    this.favoriteColors = f.favoriteColors ?? [];
    this.preferredFit = f.preferredFit;
    this.topSize = f.topSize;
    this.bottomSize = f.bottomSize;
    this.shoeSize = f.shoeSize;
    this.preferredBrands = f.preferredBrands ?? [];
    this.budgetRange = f.budgetRange;
    this.occasion = f.occasion;
    this.favoriteCategories = f.favoriteCategories ?? [];
    this.preferredFabrics = f.preferredFabrics ?? [];
    this.personality = f.personality;
    this.isRepeatCustomer = f.isRepeatCustomer ?? false;
    this.shoppingFor = f.shoppingFor;
    this.familySize = f.familySize;
    this.familyMembers = f.familyMembers ?? [];
    this.boysCount = f.boysCount;
    this.girlsCount = f.girlsCount;
    this.childAgeRanges = f.childAgeRanges ?? [];
    this.currentOutfit = f.currentOutfit;
    this.styling = f.styling;
    this.wearingColor = f.wearingColor;
    this.notes = f.notes;
  }

  static fromJson(json: any): Customer {
    const list = (key: string): string[] => ((json[key] as any[]) ?? []).map((e) => e as string);
    return new Customer({
      id: json.id as string,
      name: json.name as string | undefined,
      mobile: json.mobile as string | undefined,
      gender: json.gender as string | undefined,
      ageRange: json.ageRange as string | undefined,
      personality: json.personality as string | undefined,
      currentOutfit: json.currentOutfit as string | undefined,
      styling: json.styling as string | undefined,
      wearingColor: json.wearingColor as string | undefined,
      occasion: json.occasion as string | undefined,
      dateOfBirth: typeof json.dateOfBirth === 'string' ? json.dateOfBirth : undefined,
      occupation: json.occupation as string | undefined,
      fashionStyles: list('fashionStyles'),
      favoriteColors: list('favoriteColors'),
      preferredFit: json.preferredFit as string | undefined,
      topSize: json.topSize as string | undefined,
      bottomSize: json.bottomSize as string | undefined,
      shoeSize: json.shoeSize as string | undefined,
      budgetRange: json.budgetRange as string | undefined,
      preferredBrands: list('preferredBrands'),
      favoriteCategories: list('favoriteCategories'),
      preferredFabrics: list('preferredFabrics'),
      notes: json.notes as string | undefined,
      isRepeatCustomer: (json.isRepeatCustomer as boolean) ?? false,
      shoppingFor: json.shoppingFor as string | undefined,
      familySize: json.familySize != null ? Math.trunc(json.familySize) : undefined,
      familyMembers: list('familyMembers'),
      boysCount: json.boysCount != null ? Math.trunc(json.boysCount) : undefined,
      girlsCount: json.girlsCount != null ? Math.trunc(json.girlsCount) : undefined,
      childAgeRanges: list('childAgeRanges'),
    });
  }

  get isFamilyShopping(): boolean {
    return this.shoppingFor === 'Family';
  }

  private static blank(s?: string): boolean {
    return s == null || s.trim().length === 0;
  }

  get isEmpty(): boolean {
    const b = Customer.blank;
    return (
      b(this.name) &&
      b(this.mobile) &&
      b(this.gender) &&
      b(this.ageRange) &&
      b(this.personality) &&
      this.dateOfBirth == null &&
      b(this.occupation) &&
      this.fashionStyles.length === 0 &&
      this.favoriteColors.length === 0 &&
      b(this.preferredFit) &&
      b(this.topSize) &&
      b(this.bottomSize) &&
      b(this.shoeSize) &&
      b(this.occasion) &&
      b(this.budgetRange) &&
      this.preferredBrands.length === 0 &&
      this.favoriteCategories.length === 0 &&
      this.preferredFabrics.length === 0 &&
      b(this.currentOutfit) &&
      b(this.styling) &&
      b(this.wearingColor) &&
      b(this.notes) &&
      b(this.shoppingFor) &&
      this.familySize == null &&
      this.familyMembers.length === 0 &&
      this.boysCount == null &&
      this.girlsCount == null &&
      this.childAgeRanges.length === 0 &&
      !this.isRepeatCustomer
    );
  }

  /// Free-text signals used to score recommendations on the backend.
  get styleHints(): string[] {
    return [
      ...this.fashionStyles,
      ...this.favoriteColors,
      ...this.preferredBrands,
      ...this.favoriteCategories,
      ...this.preferredFabrics,
      this.occasion,
      this.preferredFit,
      this.personality,
      this.occupation,
      ...this.familyMembers,
      ...this.childAgeRanges,
    ].filter((x): x is string => x != null);
  }

  copyWith(patch: Partial<CustomerFields>): Customer {
    return new Customer({
      id: patch.id ?? this.id,
      name: patch.name ?? this.name,
      mobile: patch.mobile ?? this.mobile,
      gender: patch.gender ?? this.gender,
      ageRange: patch.ageRange ?? this.ageRange,
      personality: patch.personality ?? this.personality,
      currentOutfit: patch.currentOutfit ?? this.currentOutfit,
      styling: patch.styling ?? this.styling,
      wearingColor: patch.wearingColor ?? this.wearingColor,
      occasion: patch.occasion ?? this.occasion,
      dateOfBirth: patch.dateOfBirth ?? this.dateOfBirth,
      occupation: patch.occupation ?? this.occupation,
      fashionStyles: patch.fashionStyles ?? this.fashionStyles,
      favoriteColors: patch.favoriteColors ?? this.favoriteColors,
      preferredFit: patch.preferredFit ?? this.preferredFit,
      topSize: patch.topSize ?? this.topSize,
      bottomSize: patch.bottomSize ?? this.bottomSize,
      shoeSize: patch.shoeSize ?? this.shoeSize,
      budgetRange: patch.budgetRange ?? this.budgetRange,
      preferredBrands: patch.preferredBrands ?? this.preferredBrands,
      favoriteCategories: patch.favoriteCategories ?? this.favoriteCategories,
      preferredFabrics: patch.preferredFabrics ?? this.preferredFabrics,
      notes: patch.notes ?? this.notes,
      isRepeatCustomer: patch.isRepeatCustomer ?? this.isRepeatCustomer,
      shoppingFor: patch.shoppingFor ?? this.shoppingFor,
      familySize: patch.familySize ?? this.familySize,
      familyMembers: patch.familyMembers ?? this.familyMembers,
      boysCount: patch.boysCount ?? this.boysCount,
      girlsCount: patch.girlsCount ?? this.girlsCount,
      childAgeRanges: patch.childAgeRanges ?? this.childAgeRanges,
    });
  }

  toJson(): Record<string, any> {
    const out: Record<string, any> = { id: this.id };
    const put = (k: string, v: any) => {
      if (v != null) out[k] = v;
    };
    const putList = (k: string, v: string[]) => {
      if (v.length > 0) out[k] = v;
    };
    put('name', this.name);
    put('mobile', this.mobile);
    put('gender', this.gender);
    put('ageRange', this.ageRange);
    put('personality', this.personality);
    put('currentOutfit', this.currentOutfit);
    put('styling', this.styling);
    put('wearingColor', this.wearingColor);
    put('occasion', this.occasion);
    put('dateOfBirth', this.dateOfBirth);
    put('occupation', this.occupation);
    putList('fashionStyles', this.fashionStyles);
    putList('favoriteColors', this.favoriteColors);
    put('preferredFit', this.preferredFit);
    put('topSize', this.topSize);
    put('bottomSize', this.bottomSize);
    put('shoeSize', this.shoeSize);
    put('budgetRange', this.budgetRange);
    putList('preferredBrands', this.preferredBrands);
    putList('favoriteCategories', this.favoriteCategories);
    putList('preferredFabrics', this.preferredFabrics);
    put('notes', this.notes);
    if (this.isRepeatCustomer) out.isRepeatCustomer = true;
    put('shoppingFor', this.shoppingFor);
    put('familySize', this.familySize);
    putList('familyMembers', this.familyMembers);
    put('boysCount', this.boysCount);
    put('girlsCount', this.girlsCount);
    putList('childAgeRanges', this.childAgeRanges);
    return out;
  }
}

/// Static choice lists for the customer-profile form. Ported from `CustomerOptions`.
export const CustomerOptions = {
  occupations: ['Student', 'Working Professional', 'Business Owner', 'Self-Employed', 'Homemaker', 'Other'],
  fashionStyles: ['Casual', 'Smart Casual', 'Formal', 'Streetwear', 'Luxury', 'Minimalist', 'Ethnic', 'Sporty'],
  fits: ['Slim', 'Regular', 'Relaxed', 'Oversized'],
  topSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  bottomSizes: ['28', '30', '32', '34', '36', '38', '40'],
  shoeSizes: ['5', '6', '7', '8', '9', '10', '11', '12'],
  occasions: ['Office', 'Wedding', 'Party', 'Casual', 'Travel', 'Festival', 'Business Meeting', 'Date Night'],
  budgets: ['Under ₹5,000', '₹5,000 – ₹15,000', '₹15,000 – ₹30,000', '₹30,000 – ₹75,000', 'Above ₹75,000'],
  fabrics: ['Cotton', 'Linen', 'Silk', 'Wool', 'Cashmere', 'Denim', 'Leather', 'Viscose', 'Blends'],
  shoppingFor: ['Single', 'Family'],
  familyMembers: ['Mother', 'Father', 'Spouse', 'Sister', 'Brother', 'Daughter', 'Son', 'Grandparent', 'Friend'],
  childAgeRanges: ['0-2', '3-5', '6-9', '10-12', '13-17'],
  colors: ['Black', 'White', 'Navy', 'Grey', 'Beige', 'Brown', 'Red', 'Blue', 'Green', 'Pink', 'Purple', 'Yellow', 'Orange', 'Gold'],
};
