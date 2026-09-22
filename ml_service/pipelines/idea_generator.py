"""
Idea Generator Pipeline
Analyzes patterns in existing projects and generates novel FYP concepts.

Strategy:
1. Find the most popular domain + technology combinations
2. Find domain + technology pairs that are UNDERREPRESENTED (opportunity gaps)
3. Combine a student's skills/interests with trending but uncommon combos
4. Generate a structured idea with title, description, tech stack, and rationale
"""
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field
from collections import Counter
import random

from utils.logger import logger


@dataclass
class GeneratedIdea:
    """A newly generated FYP idea."""
    title: str
    description: str
    suggested_technologies: List[str]
    domains: List[str]
    difficulty_level: str
    novelty_score: float        # 0.0-1.0, higher = more unique
    rationale: str              # why this idea was generated for this student


# ── Title templates ────────────────────────────────────────────────────────────
# {domain} and {tech} are filled in dynamically

TITLE_TEMPLATES = [
    "{domain} {application_type} using {tech}",
    "Smart {domain} {application_type} with {tech}",
    "{tech}-powered {domain} {application_type}",
    "Intelligent {domain} {application_type} System",
    "AI-driven {domain} {application_type} with {tech}",
    "{domain} Analytics Platform using {tech}",
    "Automated {domain} {application_type} with {tech}",
    "Real-time {domain} Monitoring System using {tech}",
]

APPLICATION_TYPES = {
    "healthcare":       ["Diagnosis System", "Patient Management System", "Drug Interaction Checker", "Remote Monitoring App"],
    "education":        ["Learning Management System", "Student Performance Predictor", "Adaptive Quiz Platform", "Plagiarism Detector"],
    "finance":          ["Fraud Detection System", "Budget Tracker", "Stock Prediction Tool", "Expense Analyzer"],
    "ecommerce":        ["Recommendation Engine", "Price Comparison Tool", "Inventory Manager", "Customer Churn Predictor"],
    "security":         ["Intrusion Detection System", "Vulnerability Scanner", "Access Control System", "Threat Analyzer"],
    "ai-ml":            ["Classification System", "Prediction Model", "Anomaly Detector", "Pattern Recognition System"],
    "computer-vision":  ["Object Detection System", "Face Recognition App", "Document Scanner", "Defect Detection Tool"],
    "nlp":              ["Sentiment Analyzer", "Text Summarizer", "Chatbot", "Document Classifier"],
    "iot":              ["Smart Home Controller", "Environmental Monitor", "Asset Tracker", "Energy Manager"],
    "social-platform":  ["Community Platform", "Event Management App", "Collaborative Tool", "Peer Matching System"],
    "data-analytics":   ["Dashboard Builder", "Report Generator", "Data Pipeline", "Insight Extractor"],
    "blockchain":       ["Supply Chain Tracker", "Voting System", "Digital Certificate System", "Asset Registry"],
    "general":          ["Management System", "Automation Tool", "Analytics Platform", "Decision Support System"],
}

DESCRIPTION_TEMPLATES = [
    "A {difficulty} level {domain} project that leverages {tech} to {verb} {domain} data. "
    "The system {feature1} and {feature2}, making it suitable for {audience}.",

    "This project builds a {application_type} for the {domain} domain using {tech}. "
    "It addresses the challenge of {challenge} by implementing {solution}.",
]

VERBS = ["analyze", "process", "classify", "predict", "monitor", "automate", "optimize", "detect patterns in"]

FEATURES = [
    "provides real-time insights",
    "automates repetitive tasks",
    "uses ML models for prediction",
    "offers an intuitive dashboard",
    "supports multi-user collaboration",
    "integrates with existing systems",
    "generates automated reports",
    "sends smart alerts and notifications",
]

AUDIENCES = ["students", "healthcare professionals", "business analysts", "developers", "end users", "administrators"]

CHALLENGES = [
    "manual data processing",
    "lack of real-time monitoring",
    "inefficient resource allocation",
    "difficulty in pattern recognition",
    "poor user experience in existing tools",
    "data scattered across multiple sources",
]

SOLUTIONS = [
    "an ML-based classification model",
    "a real-time data pipeline",
    "an intelligent recommendation engine",
    "a user-friendly web interface",
    "automated data aggregation and analysis",
    "a microservices-based scalable architecture",
]


class IdeaGeneratorPipeline:
    """
    Generates novel FYP ideas based on:
    - Student profile (skills, interests, knowledge level)
    - Existing project patterns (domain/tech frequency)
    - Gap analysis (underrepresented combinations)
    """

    def __init__(self):
        self._domain_tech_freq: Counter = Counter()
        self._domain_freq: Counter = Counter()
        self._tech_freq: Counter = Counter()
        self._trained = False

    def fit(self, projects: List[dict]) -> None:
        """
        Learn patterns from existing projects.
        projects: list of dicts with 'domains' and 'technologies' keys.
        """
        self._domain_tech_freq.clear()
        self._domain_freq.clear()
        self._tech_freq.clear()

        for p in projects:
            domains = p.get("domains", [])
            techs = p.get("technologies", [])
            for domain in domains:
                self._domain_freq[domain] += 1
                for tech in techs:
                    self._domain_tech_freq[(domain, tech)] += 1
            for tech in techs:
                self._tech_freq[tech] += 1

        self._trained = True
        logger.info(
            f"IdeaGenerator fitted on {len(projects)} projects | "
            f"{len(self._domain_freq)} domains | {len(self._tech_freq)} technologies"
        )

    def generate(
        self,
        skills: List[str],
        interests: List[str],
        knowledge_level: str = "intermediate",
        count: int = 5,
    ) -> List[GeneratedIdea]:
        """
        Generate `count` novel FYP ideas tailored to the student's profile.
        Works with or without training data.
        """
        ideas = []

        # 1. Interest-based ideas (student's own interests × their skills)
        for interest in interests[:3]:
            idea = self._generate_from_domain(
                domain=interest.lower(),
                tech=self._pick_tech(skills),
                knowledge_level=knowledge_level,
                strategy="interest-match",
            )
            ideas.append(idea)

        # 2. Gap-based ideas (underrepresented combos the student can tackle)
        if self._trained:
            gap_ideas = self._generate_gap_ideas(skills, knowledge_level, count=count - len(ideas))
            ideas.extend(gap_ideas)

        # 3. If we still need more, generate from trending domains
        while len(ideas) < count:
            domain = self._pick_trending_domain()
            tech = self._pick_tech(skills)
            idea = self._generate_from_domain(domain, tech, knowledge_level, "trending")
            ideas.append(idea)

        return ideas[:count]

    def _generate_from_domain(
        self,
        domain: str,
        tech: str,
        knowledge_level: str,
        strategy: str,
    ) -> GeneratedIdea:
        """Generate a single idea for a given domain + tech combo."""
        app_types = APPLICATION_TYPES.get(domain, APPLICATION_TYPES["general"])
        app_type = random.choice(app_types)

        template = random.choice(TITLE_TEMPLATES)
        title = template.format(
            domain=domain.replace("-", " ").title(),
            tech=tech.title(),
            application_type=app_type,
        )

        feature1, feature2 = random.sample(FEATURES, 2)
        description = (
            f"A {knowledge_level}-level {domain.replace('-', ' ')} project using {tech}. "
            f"The system {feature1} and {feature2}, "
            f"addressing the challenge of {random.choice(CHALLENGES)} "
            f"through {random.choice(SOLUTIONS)}."
        )

        # Novelty: lower frequency = higher novelty
        freq = self._domain_tech_freq.get((domain, tech), 0)
        max_freq = max(self._domain_tech_freq.values()) if self._domain_tech_freq else 1
        novelty = round(1.0 - (freq / (max_freq + 1)), 3)

        rationale_map = {
            "interest-match": f"Generated because you expressed interest in {domain}",
            "gap-based":      f"This {domain} × {tech} combination is underrepresented — good opportunity",
            "trending":       f"This domain is trending in FYP projects right now",
        }

        return GeneratedIdea(
            title=title,
            description=description,
            suggested_technologies=self._suggest_stack(tech, domain),
            domains=[domain],
            difficulty_level=knowledge_level,
            novelty_score=novelty,
            rationale=rationale_map.get(strategy, "Generated based on your profile"),
        )

    def _generate_gap_ideas(
        self,
        skills: List[str],
        knowledge_level: str,
        count: int,
    ) -> List[GeneratedIdea]:
        """Find domain+tech combos that appear rarely — these are opportunity gaps."""
        all_domains = list(self._domain_freq.keys())
        ideas = []

        # Sort domains by frequency ascending (least common first)
        rare_domains = sorted(all_domains, key=lambda d: self._domain_freq[d])

        for domain in rare_domains:
            if len(ideas) >= count:
                break
            tech = self._pick_tech(skills)
            idea = self._generate_from_domain(domain, tech, knowledge_level, "gap-based")
            ideas.append(idea)

        return ideas

    def _pick_tech(self, skills: List[str]) -> str:
        """Pick the most relevant technology from student skills."""
        if skills:
            return random.choice(skills[:5])
        # Fallback to popular techs
        popular = ["Python", "React", "Node.js", "Flutter", "TensorFlow"]
        return random.choice(popular)

    def _pick_trending_domain(self) -> str:
        """Pick a domain from the most frequently appearing ones."""
        if self._domain_freq:
            top = self._domain_freq.most_common(5)
            return random.choice(top)[0]
        return random.choice(list(APPLICATION_TYPES.keys()))

    def _suggest_stack(self, primary_tech: str, domain: str) -> List[str]:
        """Suggest a full tech stack based on primary tech and domain."""
        stacks = {
            "python": ["Python", "FastAPI", "PostgreSQL", "React"],
            "javascript": ["Node.js", "React", "MongoDB", "Express"],
            "typescript": ["TypeScript", "React", "Node.js", "PostgreSQL"],
            "flutter": ["Flutter", "Dart", "Firebase", "REST API"],
            "tensorflow": ["Python", "TensorFlow", "Keras", "Flask", "React"],
            "pytorch": ["Python", "PyTorch", "FastAPI", "React"],
            "react": ["React", "TypeScript", "Node.js", "PostgreSQL"],
            "java": ["Java", "Spring Boot", "MySQL", "React"],
        }

        domain_extras = {
            "iot":              ["Arduino", "MQTT", "Raspberry Pi"],
            "blockchain":       ["Solidity", "Ethereum", "Web3.js"],
            "computer-vision":  ["OpenCV", "TensorFlow", "Python"],
            "nlp":              ["HuggingFace", "BERT", "Python"],
            "data-analytics":   ["Pandas", "Power BI", "Python"],
        }

        base = stacks.get(primary_tech.lower(), ["Python", "React", "PostgreSQL"])
        extras = domain_extras.get(domain, [])
        full_stack = list(dict.fromkeys(base + extras))  # deduplicate preserving order
        return full_stack[:6]
