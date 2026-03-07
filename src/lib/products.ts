export interface Product {
    id: string;
    name: string;
    brand: string;
    category: string;
    description: string;
    price: string;
    imageUrl: string;
    affiliateUrl: string;
    skinTypes: string[];
    concerns: string[];
}

// Static product catalog with affiliate links
const PRODUCT_CATALOG: Product[] = [
    // Cleansers
    {
        id: "c1", name: "Gentle Foaming Cleanser", brand: "CeraVe",
        category: "Cleanser", description: "Non-foaming, fragrance-free cleanser with ceramides and hyaluronic acid for all skin types.",
        price: "$15.99", imageUrl: "", affiliateUrl: "https://www.amazon.com/dp/B01N1LL62W",
        skinTypes: ["oily", "dry", "combination", "normal", "sensitive"], concerns: ["acne", "dryness", "sensitivity"],
    },
    {
        id: "c2", name: "Soy Face Cleanser", brand: "Fresh",
        category: "Cleanser", description: "Gentle gel cleanser with soy proteins and rosewater for a refreshed feel.",
        price: "$39.00", imageUrl: "", affiliateUrl: "https://www.sephora.com/product/soy-face-cleanser-P7880",
        skinTypes: ["normal", "combination", "sensitive"], concerns: ["dullness", "sensitivity"],
    },
    // Serums
    {
        id: "s1", name: "Hyaluronic Acid 2% + B5", brand: "The Ordinary",
        category: "Serum", description: "Multi-depth hydration serum with hyaluronic acid and vitamin B5.",
        price: "$8.90", imageUrl: "", affiliateUrl: "https://www.amazon.com/dp/B07GRK3CVR",
        skinTypes: ["oily", "dry", "combination", "normal"], concerns: ["dryness", "fine lines", "dehydration"],
    },
    {
        id: "s2", name: "Niacinamide 10% + Zinc 1%", brand: "The Ordinary",
        category: "Serum", description: "Targets pores, uneven skin tone, and oil balance with niacinamide and zinc.",
        price: "$6.50", imageUrl: "", affiliateUrl: "https://www.amazon.com/dp/B07GRK4HVP",
        skinTypes: ["oily", "combination"], concerns: ["acne", "large pores", "oiliness", "uneven tone"],
    },
    {
        id: "s3", name: "Vitamin C Serum CE Ferulic", brand: "SkinCeuticals",
        category: "Serum", description: "Premium antioxidant serum with 15% vitamin C, vitamin E, and ferulic acid.",
        price: "$182.00", imageUrl: "", affiliateUrl: "https://www.sephora.com/product/c-e-ferulic-P233435",
        skinTypes: ["normal", "dry", "combination"], concerns: ["dark spots", "dullness", "fine lines", "sun damage"],
    },
    // Moisturizers
    {
        id: "m1", name: "Moisturizing Cream", brand: "CeraVe",
        category: "Moisturizer", description: "Rich, non-comedogenic cream with ceramides for 24-hour hydration.",
        price: "$17.49", imageUrl: "", affiliateUrl: "https://www.amazon.com/dp/B00TTD9BRC",
        skinTypes: ["dry", "normal", "sensitive"], concerns: ["dryness", "sensitivity", "eczema"],
    },
    {
        id: "m2", name: "Oil-Free Moisturizer SPF 15", brand: "Neutrogena",
        category: "Moisturizer", description: "Lightweight, oil-free formula with SPF 15 broad spectrum protection.",
        price: "$13.99", imageUrl: "", affiliateUrl: "https://www.amazon.com/dp/B001E96OU6",
        skinTypes: ["oily", "combination"], concerns: ["oiliness", "acne"],
    },
    // Sunscreens
    {
        id: "sp1", name: "UV Aqua Rich Watery Essence SPF 50+", brand: "Bioré",
        category: "Sunscreen", description: "Ultra-lightweight, water-based sunscreen with SPF 50+ PA++++.",
        price: "$14.99", imageUrl: "", affiliateUrl: "https://www.amazon.com/dp/B07ND7S59X",
        skinTypes: ["oily", "combination", "normal"], concerns: ["sun protection", "oiliness"],
    },
    {
        id: "sp2", name: "Unseen Sunscreen SPF 40", brand: "Supergoop!",
        category: "Sunscreen", description: "Invisible, oil-free, scent-free sunscreen that works as a primer.",
        price: "$38.00", imageUrl: "", affiliateUrl: "https://www.sephora.com/product/unseen-sunscreen-P428224",
        skinTypes: ["oily", "dry", "combination", "normal", "sensitive"], concerns: ["sun protection"],
    },
    // Exfoliants
    {
        id: "e1", name: "BHA Liquid Exfoliant", brand: "Paula's Choice",
        category: "Exfoliant", description: "2% salicylic acid exfoliant that unclogs pores and smooths wrinkles.",
        price: "$34.00", imageUrl: "", affiliateUrl: "https://www.amazon.com/dp/B00949CTQQ",
        skinTypes: ["oily", "combination"], concerns: ["acne", "blackheads", "large pores", "texture"],
    },
    {
        id: "e2", name: "Glycolic Acid 7% Toning Solution", brand: "The Ordinary",
        category: "Exfoliant", description: "Mild exfoliation with glycolic acid for improved radiance and clarity.",
        price: "$9.60", imageUrl: "", affiliateUrl: "https://www.amazon.com/dp/B071Z7CHZ3",
        skinTypes: ["normal", "combination"], concerns: ["dullness", "uneven tone", "texture"],
    },
    // Eye Cream
    {
        id: "ec1", name: "Retinol Eye Cream", brand: "RoC",
        category: "Eye Cream", description: "Anti-aging eye cream with retinol to reduce dark circles and fine lines.",
        price: "$24.49", imageUrl: "", affiliateUrl: "https://www.amazon.com/dp/B00027DDOQ",
        skinTypes: ["normal", "dry", "combination"], concerns: ["dark circles", "fine lines", "wrinkles"],
    },
];

export function getProductRecommendations(
    skinType: string,
    concerns: string[],
    limit = 6
): (Product & { matchScore: number })[] {
    const normalizedConcerns = concerns.map((c) => c.toLowerCase());
    const normalizedSkinType = skinType.toLowerCase();

    const scored = PRODUCT_CATALOG.map((product) => {
        let score = 0;

        // Skin type match (+40)
        if (product.skinTypes.includes(normalizedSkinType)) {
            score += 40;
        }

        // Concern match (+15 per concern)
        const matchedConcerns = product.concerns.filter((c) =>
            normalizedConcerns.some((uc) => c.includes(uc) || uc.includes(c))
        );
        score += matchedConcerns.length * 15;

        // Bonus for multiple concern matches
        if (matchedConcerns.length >= 2) score += 10;

        return { ...product, matchScore: Math.min(score, 100) };
    });

    return scored
        .filter((p) => p.matchScore > 20)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);
}
