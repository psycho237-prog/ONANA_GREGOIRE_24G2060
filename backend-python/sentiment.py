import sys
import json
import re

# Keyword-based French sentiment analysis (no external deps needed)
POSITIVE_WORDS = [
    "excellent", "bien", "super", "génial", "incroyable", "intéressant", "clair",
    "parfait", "bravo", "merci", "facile", "utile", "enrichissant", "passionnant",
    "top", "magnifique", "formidable", "j'adore", "satisfait", "apprécié",
    "compréhensible", "motivant", "accessible", "logique", "instructif",
    "agréable", "dynamique", "efficace", "clair", "positif", "bonne", "bon",
    "content", "heureux", "super", "ouvert", "approfondi", "maîtrise", "réussi"
]

NEGATIVE_WORDS = [
    "nul", "mauvais", "difficile", "compliqué", "ennuyeux", "incompréhensible",
    "lent", "pas assez", "absent", "manque", "problème", "trop dur", "trop",
    "pénible", "décevant", "monotone", "insuffisant", "frustrant", "aucun",
    "pas clair", "aucune", "raté", "échoué", "triste", "mal", "horrible",
    "désorganisé", "confus", "inintéressant", "long", "perd", "perdu",
    "difficile", "incompétent", "absent", "mauvaise", "faible", "nul"
]

NEUTRAL_WORDS = [
    "correct", "moyen", "ordinaire", "basique", "standard", "normal",
    "acceptable", "assez", "peut-être", "parfois", "souvent"
]

def analyze_sentiment(text: str):
    text_lower = text.lower()
    # Remove punctuation
    text_clean = re.sub(r'[^\w\s]', ' ', text_lower)
    words = text_clean.split()
    
    pos_score = sum(1 for w in POSITIVE_WORDS if w in text_clean)
    neg_score = sum(1 for w in NEGATIVE_WORDS if w in text_clean)
    
    # Compute normalized polarity
    total = pos_score + neg_score
    if total == 0:
        polarity = 0.0
    else:
        polarity = (pos_score - neg_score) / total
    
    if polarity > 0.1:
        sentiment = "positive"
    elif polarity < -0.1:
        sentiment = "negative"
    else:
        sentiment = "neutral"
    
    return sentiment, round(polarity, 4)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"sentiment": "neutral", "score": 0.0}))
        sys.exit(0)
    
    text = " ".join(sys.argv[1:])
    sentiment, score = analyze_sentiment(text)
    print(json.dumps({"sentiment": sentiment, "score": score}))
