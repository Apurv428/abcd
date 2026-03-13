export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  rating: number;
  skinTypes: string[];
  concerns: string[];
  affiliateUrls: { amazon?: string; sephora?: string };
  badge?: "Best Seller" | "Editor's Pick" | "Cult Classic" | "Dermatologist Recommended" | "Fan Favourite";
}

export const PRODUCT_CATALOG: Product[] = [
  // Cleansers
  { id: "c1", name: "Gentle Foaming Cleanser", brand: "CeraVe", category: "Cleanser", description: "Non-irritating foaming cleanser with ceramides and niacinamide for all skin types.", price: 15.99, rating: 4.7, skinTypes: ["oily", "dry", "combination", "normal", "sensitive"], concerns: ["acne", "dryness", "sensitivity"], affiliateUrls: { amazon: "https://www.amazon.com/dp/B01N1LL62W" }, badge: "Best Seller" },
  { id: "c2", name: "Soy Face Cleanser", brand: "Fresh", category: "Cleanser", description: "Gentle gel cleanser with soy proteins and rosewater for a refreshed feel.", price: 39.00, rating: 4.5, skinTypes: ["normal", "combination", "sensitive"], concerns: ["dullness", "sensitivity"], affiliateUrls: { sephora: "https://www.sephora.com/product/soy-face-cleanser-P7880" }, badge: "Editor's Pick" },
  // Toners
  { id: "t1", name: "Glycolic Acid 7% Toning Solution", brand: "The Ordinary", category: "Toner", description: "Exfoliating toner with glycolic acid for improved radiance and clarity.", price: 9.60, rating: 4.4, skinTypes: ["normal", "combination", "oily"], concerns: ["dullness", "uneven tone", "texture", "large pores"], affiliateUrls: { amazon: "https://www.amazon.com/dp/B071Z7CHZ3", sephora: "https://www.sephora.com/product/the-ordinary-glycolic-acid-7-toning-solution-P427406" } },
  { id: "t2", name: "Hydrating Toner", brand: "Klairs", category: "Toner", description: "Deeply hydrating unscented toner for sensitive skin with hyaluronic acid.", price: 22.00, rating: 4.6, skinTypes: ["dry", "sensitive", "normal"], concerns: ["dryness", "sensitivity", "dehydration"], affiliateUrls: { amazon: "https://www.amazon.com/dp/B00PGOFYG0" }, badge: "Fan Favourite" },
  // Serums
  { id: "s1", name: "Hyaluronic Acid 2% + B5", brand: "The Ordinary", category: "Serum", description: "Multi-depth hydration serum with hyaluronic acid and vitamin B5.", price: 8.90, rating: 4.5, skinTypes: ["oily", "dry", "combination", "normal"], concerns: ["dryness", "fine lines", "dehydration"], affiliateUrls: { amazon: "https://www.amazon.com/dp/B07GRK3CVR" }, badge: "Best Seller" },
  { id: "s2", name: "Niacinamide 10% + Zinc 1%", brand: "The Ordinary", category: "Serum", description: "Targets pores, uneven skin tone, and oil balance with niacinamide and zinc.", price: 6.50, rating: 4.3, skinTypes: ["oily", "combination"], concerns: ["acne", "large pores", "oiliness", "uneven tone"], affiliateUrls: { amazon: "https://www.amazon.com/dp/B07GRK4HVP" }, badge: "Cult Classic" },
  { id: "s3", name: "Vitamin C Serum CE Ferulic", brand: "SkinCeuticals", category: "Serum", description: "Premium antioxidant serum with 15% vitamin C, vitamin E, and ferulic acid.", price: 182.00, rating: 4.8, skinTypes: ["normal", "dry", "combination"], concerns: ["dark spots", "dullness", "fine lines", "sun damage"], affiliateUrls: { sephora: "https://www.sephora.com/product/c-e-ferulic-P233435" }, badge: "Dermatologist Recommended" },
  // Moisturizers
  { id: "m1", name: "Moisturizing Cream", brand: "CeraVe", category: "Moisturizer", description: "Rich, non-comedogenic cream with ceramides for 24-hour hydration.", price: 17.49, rating: 4.7, skinTypes: ["dry", "normal", "sensitive"], concerns: ["dryness", "sensitivity"], affiliateUrls: { amazon: "https://www.amazon.com/dp/B00TTD9BRC" }, badge: "Best Seller" },
  { id: "m2", name: "Gel Moisturizer", brand: "Neutrogena Hydro Boost", category: "Moisturizer", description: "Oil-free, lightweight gel-cream with hyaluronic acid for oily skin.", price: 19.99, rating: 4.5, skinTypes: ["oily", "combination"], concerns: ["oiliness", "dehydration"], affiliateUrls: { amazon: "https://www.amazon.com/dp/B00NR1YQHM" } },
  // Sunscreens
  { id: "sp1", name: "UV Aqua Rich Watery Essence SPF 50+", brand: "Bioré", category: "Sunscreen", description: "Ultra-lightweight, water-based sunscreen with SPF 50+ PA++++.", price: 14.99, rating: 4.6, skinTypes: ["oily", "combination", "normal"], concerns: ["sun damage", "oiliness"], affiliateUrls: { amazon: "https://www.amazon.com/dp/B07ND7S59X" }, badge: "Cult Classic" },
  { id: "sp2", name: "Unseen Sunscreen SPF 40", brand: "Supergoop!", category: "Sunscreen", description: "Invisible, oil-free, scent-free sunscreen that works as a makeup primer.", price: 38.00, rating: 4.7, skinTypes: ["oily", "dry", "combination", "normal", "sensitive"], concerns: ["sun damage"], affiliateUrls: { sephora: "https://www.sephora.com/product/unseen-sunscreen-P428224" }, badge: "Editor's Pick" },
  // Exfoliants
  { id: "e1", name: "BHA Liquid Exfoliant", brand: "Paula's Choice", category: "Exfoliant", description: "2% salicylic acid exfoliant that unclogs pores and smooths wrinkles.", price: 34.00, rating: 4.6, skinTypes: ["oily", "combination"], concerns: ["acne", "large pores", "texture"], affiliateUrls: { amazon: "https://www.amazon.com/dp/B00949CTQQ" }, badge: "Cult Classic" },
  { id: "e2", name: "AHA 30% + BHA 2% Peeling Solution", brand: "The Ordinary", category: "Exfoliant", description: "10-minute exfoliating treatment for experienced users. Targets texture and radiance.", price: 7.90, rating: 4.3, skinTypes: ["normal", "oily", "combination"], concerns: ["dullness", "texture", "uneven tone", "acne"], affiliateUrls: { amazon: "https://www.amazon.com/dp/B071D4D5DT", sephora: "https://www.sephora.com/product/the-ordinary-aha-30-bha-2-exfoliating-peeling-solution-P442563" } },
  // Eye Cream
  { id: "ec1", name: "Retinol Eye Cream", brand: "RoC", category: "Eye Cream", description: "Anti-aging eye cream with retinol to reduce dark circles and fine lines.", price: 24.49, rating: 4.4, skinTypes: ["normal", "dry", "combination"], concerns: ["dark circles", "fine lines", "wrinkles"], affiliateUrls: { amazon: "https://www.amazon.com/dp/B00027DDOQ" }, badge: "Dermatologist Recommended" },
  { id: "ec2", name: "Caffeine Solution 5% + EGCG", brand: "The Ordinary", category: "Eye Cream", description: "Lightweight serum targeting puffiness and dark circles around the eyes.", price: 7.70, rating: 4.2, skinTypes: ["oily", "dry", "combination", "normal", "sensitive"], concerns: ["dark circles", "puffiness"], affiliateUrls: { amazon: "https://www.amazon.com/dp/B06VSJ3J67" }, badge: "Fan Favourite" },
  // Masks
  { id: "mk1", name: "Honey Potion Renewing Antioxidant Hydration Mask", brand: "Farmacy", category: "Mask", description: "Warming honey mask with antioxidants for deep hydration and glow.", price: 38.00, rating: 4.5, skinTypes: ["dry", "normal", "combination"], concerns: ["dryness", "dullness"], affiliateUrls: { sephora: "https://www.sephora.com/product/honey-potion-P411288" }, badge: "Editor's Pick" },
  { id: "mk2", name: "Aztec Secret Indian Healing Clay", brand: "Aztec Secret", category: "Mask", description: "100% natural calcium bentonite clay mask for deep pore cleansing.", price: 9.99, rating: 4.5, skinTypes: ["oily", "combination"], concerns: ["acne", "large pores", "oiliness"], affiliateUrls: { amazon: "https://www.amazon.com/dp/B0014P8L9W" }, badge: "Best Seller" },
];

export function getProductRecommendations(
  skinType: string,
  concerns: string[],
  limit = 16
): (Product & { matchScore: number })[] {
  const normalizedConcerns = concerns.map((c) => c.toLowerCase());
  const normalizedSkinType = skinType.toLowerCase();

  const scored = PRODUCT_CATALOG.map((product) => {
    let score = 0;

    // Skin type match: +40
    if (product.skinTypes.includes(normalizedSkinType)) score += 40;

    // Concern match: +18 per concern
    const matchedConcerns = product.concerns.filter((c) =>
      normalizedConcerns.some((uc) => c.includes(uc) || uc.includes(c))
    );
    score += matchedConcerns.length * 18;

    // 2+ concern matches bonus: +12
    if (matchedConcerns.length >= 2) score += 12;

    // Badge bonus: +5
    if (product.badge) score += 5;

    return { ...product, matchScore: Math.min(score, 100) };
  });

  return scored
    .filter((p) => p.matchScore > 20)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}
