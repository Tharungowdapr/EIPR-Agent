"""
Seed script — creates a demo user + fully populated sample project.

Run:  .venv/bin/python scripts/seed_demo.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.database import SessionLocal, engine, Base
from core.security import hash_password
from models.user import User
from models.project import Project, Output

Base.metadata.create_all(bind=engine)
db = SessionLocal()

existing = db.query(User).filter(User.email == "demo@eipr.dev").first()
if existing:
    print("Demo user already exists. Deleting and recreating...")
    db.query(Output).filter(Output.project_id.in_(
        db.query(Project.id).filter(Project.user_id == existing.id)
    )).delete(synchronize_session=False)
    db.query(Project).filter(Project.user_id == existing.id).delete()
    db.delete(existing)
    db.commit()

user = User(
    email="demo@eipr.dev",
    name="Demo User",
    hashed_password=hash_password("demo123456"),
    preferred_provider="ollama",
    preferred_model="llama3.2",
    ollama_base_url="http://localhost:11434",
)
db.add(user)
db.commit()
db.refresh(user)

opportunities = {
    "opportunities": [
        {
            "id": 0,
            "title": "AI-Powered Personalized Learning Platform",
            "description": "An adaptive e-learning platform that uses AI to create personalized learning paths for K-12 students based on their learning style, pace, and performance.",
            "domain": "EdTech",
            "problem_statement": "Traditional one-size-fits-all education fails to address individual student needs, leading to gaps in understanding and disengagement.",
            "target_customer": "K-12 schools, coaching centers, and parents in urban and semi-urban India",
            "market_size": "India's edtech market is projected to reach $10.4B by 2025, with personalized learning being the fastest-growing segment.",
            "revenue_model": "Subscription-based (schools) + Freemium (individual students) + B2G (government contracts)",
            "competitors": ["Byju's", "Unacademy", "Vedantu", "Khan Academy"],
            "competitive_advantage": "Proprietary adaptive learning algorithm trained on Indian curriculum data",
            "feasibility_score": 85,
            "ip_considerations": "Patentable adaptive learning algorithm; copyright on content; trademark on brand name",
            "required_skills": ["Machine Learning", "Full-stack Development", "Content Creation", "Sales & Partnerships"],
            "estimated_effort": "6-8 months for MVP, 12-18 months for full platform",
            "why_entrepreneurial": "Addresses a massive unmet need in India's 250M+ student population with scalable technology"
        },
        {
            "id": 1,
            "title": "Blockchain-Based Academic Credential Verification",
            "description": "A decentralized platform for issuing, storing, and verifying academic credentials using blockchain technology, eliminating fake degrees.",
            "domain": "Blockchain / EdTech",
            "problem_statement": "Degree fraud costs employers millions annually; current verification is slow, manual, and insecure.",
            "target_customer": "Universities, employers, and professional certification bodies",
            "market_size": "Global credential verification market expected to reach $12.8B by 2027.",
            "revenue_model": "Per-credential issuance fee + annual enterprise licensing + verification charges",
            "competitors": ["TrueCred", "Blockcerts", "Certifaction", "Learning Machine"],
            "competitive_advantage": "Integration with Indian university systems (AICTE, UGC compliant); lower cost per verification",
            "feasibility_score": 72,
            "ip_considerations": "Blockchain consensus mechanism patent; smart contract copyright; trademark",
            "required_skills": ["Blockchain Development", "Smart Contracts", "Partnerships with Universities"],
            "estimated_effort": "4-6 months for prototype, 8-12 months for production",
            "why_entrepreneurial": "Solves a trust problem in a market with clear regulatory tailwinds (Digital India, NEP 2020)"
        },
        {
            "id": 2,
            "title": "AI-Powered Agricultural Advisory for Small Farmers",
            "description": "Mobile app using satellite imagery and ML to provide personalized crop advisory, pest detection, weather alerts, and market price information to smallholder farmers.",
            "domain": "AgriTech",
            "problem_statement": "Small farmers lack access to expert agricultural advice, leading to suboptimal yields and income uncertainty.",
            "target_customer": "Small and marginal farmers in India (86% of all farmers)",
            "market_size": "Indian agritech market projected at $24B by 2025.",
            "revenue_model": "Freemium + Premium subscription (advanced analytics) + Partnership with agri-input companies",
            "competitors": ["CropIn", "DeHaat", "Ninjacart", "AgriBazaar"],
            "competitive_advantage": "Vernacular language support; offline-first architecture; hyperlocal advisory",
            "feasibility_score": 78,
            "ip_considerations": "Crop disease detection model patent; geospatial data processing algorithm",
            "required_skills": ["Computer Vision", "Agronomy Knowledge", "Mobile Development", "Rural Marketing"],
            "estimated_effort": "8-10 months for MVP",
            "why_entrepreneurial": "Huge social impact potential with a scalable business model in a government-priority sector"
        }
    ]
}

ip_analysis = {
    "patent_analysis": {
        "summary": "The personalized learning space has significant patent activity, primarily around adaptive learning algorithms and content delivery systems.",
        "key_patents": [
            {"title": "Adaptive learning system and method", "status": "Granted", "jurisdiction": "US", "assignee": "Knewton"},
            {"title": "Personalized educational content recommendation", "status": "Pending", "jurisdiction": "India", "assignee": "Byju's"},
            {"title": "AI-based student performance prediction", "status": "Granted", "jurisdiction": "US", "assignee": "IBM"}
        ],
        "freedom_to_operate": "Moderate risk — several adaptive learning patents exist, but room for innovation in India-specific curriculum adaptation",
        "white_spaces": ["Regional language adaptive learning", "Offline-first personalized learning", "Multi-modal learning analytics"]
    },
    "trademark_analysis": {
        "summary": "EdTech branding is crowded but distinct naming is achievable.",
        "existing_marks": ["BYJU'S", "UNACADEMY", "VEDANTU", "KHAN ACADEMY"],
        "recommendation": "Choose a unique, non-descriptive name and file Class 9 (education) and Class 42 (software) trademarks in India."
    },
    "trade_secrets": [
        "Adaptive learning algorithm and weighting system",
        "Student learning pattern dataset and analysis methodology",
        "Content recommendation engine logic",
        "Assessment difficulty calibration algorithm"
    ],
    "copyright": ["Platform source code", "Educational content and curriculum", "User interface design", "Question bank and assessments"],
    "ip_strategy_roadmap": {
        "short_term": "File provisional patent for adaptive algorithm; trademark registration; copyright all original content",
        "medium_term": "File complete patent; build patent portfolio around specific innovations; establish trade secret protection",
        "long_term": "Cross-license with major players; consider defensive patent aggregation; build IP monetization strategy"
    }
}

business_plan = {
    "swoc_analysis": {
        "strengths": ["Proprietary adaptive learning algorithm", "Deep understanding of Indian curriculum", "Strong team with ML + education expertise", "First-mover advantage in personalized learning for Indian K-12"],
        "weaknesses": ["High initial content creation costs", "Brand recognition from scratch", "Limited sales team initially", "Dependence on institutional partnerships"],
        "opportunities": ["NEP 2020 emphasis on personalized learning", "Growing internet penetration in rural India", "Government digital education initiatives", "Increasing willingness to pay for quality education"],
        "challenges": ["Intense competition from established players", "Regulatory changes in edtech sector", "Data privacy concerns with student data", "Long sales cycles with institutions"]
    },
    "porters_five_forces": {
        "threat_of_new_entrants": "High — low barriers to entry in EdTech; but personalized learning requires significant R&D investment",
        "bargaining_power_of_buyers": "High — schools and parents have many options; switching costs are moderate",
        "bargaining_power_of_suppliers": "Low — content creators and developers are widely available",
        "threat_of_substitutes": "Medium — traditional tutoring, offline coaching centers, and free resources like YouTube",
        "competitive_rivalry": "High — Byju's, Unacademy, Vedantu are well-funded and established"
    },
    "marketing_mix_4ps": {
        "product": "AI-Powered Personalized Learning Platform with adaptive assessments, customized content, and real-time progress tracking",
        "price": "Tiered pricing: Basic (free), Pro (₹499/month), School (₹50/student/year), Enterprise (custom)",
        "place": "Direct sales to schools; online self-service; partnerships with state education boards",
        "promotion": "Digital marketing; school demo programs; teacher ambassador program; edtech conferences"
    },
    "stp_analysis": {
        "segmentation": "K-12 students (by grade, subject, learning level); Schools (by board, size, location); Parents (by income, aspirations)",
        "targeting": "Urban and semi-urban English-medium schools in top 20 Indian cities; parents of Class 6-12 students",
        "positioning": "Most intelligent, India-specific personalized learning platform — 'Learning that adapts to you'"
    },
    "unique_value_proposition": "The only AI-powered learning platform built specifically for the Indian K-12 curriculum that adapts in real-time to each student's unique learning style and pace.",
    "growth_strategy": "Freemium model for user acquisition → B2B school partnerships for revenue → B2G state board contracts for scale → International expansion to other developing countries"
}

financial_analysis = {
    "cost_structure": {
        "development": {"initial": "₹1.5 Cr", "annual_maintenance": "₹40 Lakhs"},
        "content_creation": {"initial": "₹80 Lakhs", "annual_update": "₹25 Lakhs"},
        "marketing_sales": {"initial": "₹60 Lakhs", "annual": "₹50 Lakhs"},
        "operations": {"initial": "₹30 Lakhs", "annual": "₹35 Lakhs"},
        "infrastructure": {"initial": "₹25 Lakhs", "annual": "₹15 Lakhs"},
        "total_initial_investment": "₹3.45 Cr"
    },
    "revenue_projections": {
        "year_1": {"schools": 50, "students": 50000, "revenue": "₹2.5 Cr", "burn": "₹2.8 Cr", "net": "-₹0.3 Cr"},
        "year_2": {"schools": 200, "students": 200000, "revenue": "₹8.5 Cr", "burn": "₹4.5 Cr", "net": "₹4.0 Cr"},
        "year_3": {"schools": 500, "students": 500000, "revenue": "₹22 Cr", "burn": "₹7.2 Cr", "net": "₹14.8 Cr"},
        "year_5": {"schools": 2000, "students": 2500000, "revenue": "₹85 Cr", "burn": "₹18 Cr", "net": "₹67 Cr"}
    },
    "break_even_analysis": "Break-even expected in Month 16-18 of operations, after acquiring approximately 120 schools.",
    "funding_strategy": {
        "seed": "₹75 Lakhs — Angel investors / Founder's capital (Month 0)",
        "pre_series_a": "₹3 Cr — Early-stage VCs / EdTech funds (Month 8)",
        "series_a": "₹15 Cr — Growth VCs (Month 18, post-breakeven)"
    },
    "key_metrics": {
        "cac": "₹1,200 per school; ₹150 per student",
        "ltv": "₹8,500 per school (3-year avg); ₹2,400 per student (loyalty-adjusted)",
        "ltv_cac_ratio": "7.1:1 for schools; 16:1 for students",
        "monthly_churn": "3.5% for schools; 8% for individual students"
    },
    "funding_ask": "Seeking ₹3.45 Cr seed funding for 18-month runway to reach 50 schools and 50,000 students."
}

report = {
    "title": "AI-Powered Personalized Learning Platform: An EIPR Case Study",
    "executive_summary": "This case study analyzes the entrepreneurial opportunity of building an AI-powered personalized learning platform for the Indian K-12 education market. The analysis covers opportunity discovery, IP strategy, business planning, and financial feasibility, aligned with all five units of the EIPR curriculum.",
    "curriculum_mapping": [
        {"unit": "I: Entrepreneurship Foundations", "coverage": "Entrepreneurial mindset, opportunity identification, risk assessment"},
        {"unit": "II: Entrepreneurial Process", "coverage": "Idea validation, market research, business model development"},
        {"unit": "III: Business Planning & Finance", "coverage": "Business plan, financial projections, funding strategy"},
        {"unit": "IV: Intellectual Property Rights", "coverage": "Patent analysis, trademark strategy, trade secrets, copyright"},
        {"unit": "V: IP Management & Strategy", "coverage": "IP portfolio development, freedom to operate, monetization"}
    ],
    "key_learnings": [
        "Identifying genuine market gaps requires deep domain understanding",
        "IP strategy should be integrated from Day 1, not an afterthought",
        "Sustainable competitive advantage comes from a combination of technology, content, and relationships",
        "Financial planning must balance ambition with realistic unit economics",
        "EIPR framework provides a comprehensive approach to venture creation"
    ],
    "learning_outcomes": [
        "Apply entrepreneurial frameworks to identify and evaluate opportunities",
        "Conduct IP landscape analysis for technology ventures",
        "Develop comprehensive business plans with financial projections",
        "Create integrated IP strategies aligned with business goals",
        "Synthesize multi-disciplinary analysis into actionable recommendations"
    ],
    "conclusion": "The AI-powered personalized learning platform represents a viable entrepreneurial opportunity with strong market potential, clear IP differentiation, and sound financial fundamentals. The venture aligns with national education priorities and leverages technology to address a critical societal need."
}

project = Project(
    user_id=user.id,
    title="AI-Powered Personalized Learning Platform",
    domain="EdTech",
    input_text="I want to build an AI-powered personalized learning platform for K-12 students in India that adapts to each student's learning style and pace. The platform will use machine learning to analyze student performance and create custom learning paths.",
    user_context="Team of 3 founders (ML engineer, full-stack developer, education specialist). Initial budget of ₹75 Lakhs from angel investors. Based in Bangalore.",
    status="done",
    current_stage="report",
)
db.add(project)
db.commit()
db.refresh(project)

outputs = [
    Output(project_id=project.id, output_type="opportunities", data=opportunities),
    Output(project_id=project.id, output_type="ip_analysis_0", data=ip_analysis),
    Output(project_id=project.id, output_type="business_plan_0", data=business_plan),
    Output(project_id=project.id, output_type="financial_0", data=financial_analysis),
    Output(project_id=project.id, output_type="report", data=report),
]
for o in outputs:
    db.add(o)
db.commit()

print(f"✅ Demo user created!")
print(f"   Email:    demo@eipr.dev")
print(f"   Password: demo123456")
print(f"   Project:  '{project.title}' with all 5 stages populated")
print(f"\nLogin at http://localhost:3000/auth/login and explore the full workflow.")
db.close()
