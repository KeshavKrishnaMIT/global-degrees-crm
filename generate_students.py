from faker import Faker
import pandas as pd
import random
from datetime import timedelta

fake = Faker("en_IN")

cities = {
    "Indore": "Madhya Pradesh",
    "Bhopal": "Madhya Pradesh",
    "Delhi": "Delhi",
    "Mumbai": "Maharashtra",
    "Pune": "Maharashtra",
    "Bangalore": "Karnataka",
    "Hyderabad": "Telangana",
    "Chennai": "Tamil Nadu",
    "Ahmedabad": "Gujarat",
    "Jaipur": "Rajasthan"
}

degrees = ["BTech", "BSc", "BCom", "BBA", "BA"]

streams = [
    "CSE",
    "IT",
    "ECE",
    "Mechanical",
    "Finance",
    "Marketing",
    "Biotechnology"
]

courses = [
    "Data Science",
    "Computer Science",
    "Business Analytics",
    "Cyber Security",
    "Artificial Intelligence",
    "MBA",
    "Finance"
]

lead_sources = [
    "Instagram",
    "WhatsApp",
    "Website",
    "Referral",
    "Seminar"
]

stages = [
    "New Lead",
    "Contacted",
    "Counseling",
    "Documents",
    "Application",
    "Offer Letter",
    "Visa",
    "Enrolled"
]

counselors = [
    "Priya Sharma",
    "Amit Verma",
    "Sneha Jain",
    "Rahul Singh",
    "Rohit Gupta"
]

data = []

for i in range(5000):

    city = random.choice(list(cities.keys()))
    state = cities[city]

    cgpa = round(random.uniform(6.0, 9.8), 2)
    ielts = round(random.uniform(5.5, 8.5), 1)

    budget = random.randint(800000, 3500000)

    if budget < 1500000:
        preferred_country = random.choice(
            ["Germany", "Germany", "Germany", "Canada"]
        )
    elif budget < 2500000:
        preferred_country = random.choice(
            ["Canada", "Australia", "UK"]
        )
    else:
        preferred_country = random.choice(
            ["USA", "Canada", "Australia", "UK"]
        )

    if ielts >= 7.5:
        preferred_country = random.choice(
            ["Canada", "Australia", "UK"]
        )

    if cgpa > 8.5:
        scholarship_required = "Yes"
    else:
        scholarship_required = random.choice(
            ["Yes", "No"]
        )

    lead_source = random.choice(lead_sources)

    stage = random.choice(stages)

    if stage == "Enrolled":
        status = "Converted"
    elif stage == "Visa":
        status = random.choice(
            ["Converted", "Converted", "Active"]
        )
    else:
        status = random.choice(
            ["Active", "Inactive", "Dropped"]
        )

    lead_score = 50

    lead_score += int((cgpa - 6) * 10)
    lead_score += int((ielts - 5.5) * 10)

    if lead_source == "Referral":
        lead_score += 15

    if budget > 2000000:
        lead_score += 10

    lead_score = min(100, max(1, lead_score))

    enrollment_probability = min(
        99,
        max(
            5,
            lead_score + random.randint(-10, 10)
        )
    )

    if lead_score >= 80:
        dropout_risk = "Low"
    elif lead_score >= 60:
        dropout_risk = "Medium"
    else:
        dropout_risk = "High"

    if budget < 1500000:
        recommended_country = "Germany"
    elif ielts >= 7:
        recommended_country = "Canada"
    else:
        recommended_country = preferred_country

    if cgpa >= 8.5:
        recommended_scholarship = "Merit Scholarship"
    elif cgpa >= 7.5:
        recommended_scholarship = "Partial Scholarship"
    else:
        recommended_scholarship = "Not Eligible"

    created_date = fake.date_between(
        start_date="-2y",
        end_date="today"
    )

    last_activity_date = created_date + timedelta(
        days=random.randint(1, 120)
    )

    row = {
        "student_id": f"ST{1000+i}",
        "name": fake.name(),
        "gender": random.choice(
            ["Male", "Female"]
        ),
        "age": random.randint(18, 28),
        "city": city,
        "state": state,
        "degree": random.choice(degrees),
        "stream": random.choice(streams),
        "cgpa": cgpa,
        "ielts_score": ielts,
        "preferred_country": preferred_country,
        "preferred_course": random.choice(courses),
        "budget": budget,
        "scholarship_required": scholarship_required,
        "lead_source": lead_source,
        "current_stage": stage,
        "assigned_counselor": random.choice(counselors),
        "created_date": created_date,
        "last_activity_date": last_activity_date,
        "status": status,
        "enrollment_probability": enrollment_probability,
        "dropout_risk": dropout_risk,
        "lead_score": lead_score,
        "recommended_country": recommended_country,
        "recommended_scholarship": recommended_scholarship
    }

    data.append(row)

df = pd.DataFrame(data)

df.to_csv(
    "data/study_abroad_students.csv",
    index=False
)

print("Dataset Generated Successfully")
print("Records:", len(df))