# Global Degrees CRM Platform - Summer Internship Project 1

A full-stack AI-powered CRM and student management platform built to streamline international education consulting workflows. The platform combines large-scale CRM management, advanced analytics, intelligent recommendation systems, and conversational AI to help counselors and management teams make faster, data-driven decisions.

Designed around a real-world study abroad consultancy workflow, the system manages thousands of student records while providing instant business intelligence through AI-powered conversations, dynamic dashboards, and historical CRM analytics.

---

# Live Demo

**Application:**
https://global-degrees-crm-i95l.vercel.app

---

# Project Overview

Global Degrees CRM was designed to simulate a production-level study abroad consultancy management platform.

Instead of functioning as a traditional student database, the CRM acts as an intelligent decision-support system capable of analyzing thousands of student records in real time.

The platform consolidates:

* Student records
* Counselor assignments
* University recommendations
* Admission analytics
* Application pipelines
* Scholarship insights
* Country-specific trends
* AI-assisted executive decision making

Unlike conventional dashboards that only display charts, this CRM allows users to interact with the underlying dataset through natural language conversations.

Managers can simply ask questions such as:

* Which country has the highest conversion rate?
* Average CGPA of UK applicants
* Students below 6.5 CGPA
* Average budget of Australia applicants
* Which counselor needs coaching?
* Where are students dropping off?
* Which lead source generates the best ROI?

The AI instantly analyzes live CRM data, performs calculations, applies filters, and returns meaningful business insights without requiring manual reports or SQL queries.

---

# Key Features

## Executive Dashboard

* Live CRM performance monitoring
* Student lifecycle visualization
* Active, converted, and dropped student tracking
* Executive KPIs
* Revenue monitoring
* Country-wise admissions overview
* Conversion funnel analytics
* Demographic insights
* Business intelligence summaries

---

## Student Management

* Centralized student database
* Search, sorting, and advanced filtering
* Student profile management
* Academic profile tracking
* Application status monitoring
* Large-scale dataset handling
* Dynamic CRM updates

---

## Counselor Management

* Counselor performance tracking
* Lead assignment workflows
* Student-to-counselor mapping
* Productivity monitoring
* Conversion performance analysis
* Coaching recommendations

---

## Analytics Engine

* Conversion analytics
* Enrollment trend analysis
* Country-wise reporting
* Budget analysis
* Academic trend analysis
* Scholarship insights
* Pipeline performance metrics
* Executive dashboards
* Dynamic KPI generation

---

## AI Recommendation System

The recommendation engine combines historical CRM data with student academic profiles to generate realistic university recommendations.

The recommendation pipeline evaluates multiple admission factors simultaneously, including:

* CGPA
* IELTS score
* Budget
* Preferred country
* Historical admission patterns
* Scholarship eligibility
* University selectivity
* Financial feasibility

Each recommendation includes:

* Admission confidence
* Match percentage
* Safety / Moderate / Dream categorization
* Global university ranking
* Estimated tuition information
* Scholarship guidance
* Official university website
* Country insights
* Personalized reasoning behind every recommendation

The recommendation engine is designed to behave like an experienced admission counselor rather than a simple filtering system.

---

## AI Executive Copilot

One of the core highlights of the project is the AI Executive Copilot.

Rather than generating static chatbot responses, the Copilot performs real CRM reasoning over thousands of student records.

The AI understands natural language, extracts user intent, applies multiple filters, performs live calculations, and generates business insights instantly.

Capabilities include:

* Natural language querying over CRM data
* Live database calculations
* Multi-filter analysis
* Context-aware conversations
* Executive business summaries
* Conversion analytics
* Funnel bottleneck identification
* Lead source effectiveness analysis
* Counselor performance evaluation
* Student segmentation
* Scholarship analysis
* Country comparison
* Budget analysis
* Academic trend analysis
* Dropout analysis
* Pipeline health monitoring
* Risk identification
* Follow-up recommendations
* Strategic business recommendations

Example questions supported:

* Average budget of Australia applicants
* Students below 6.5 CGPA
* Average IELTS of UK applicants
* Compare Australia vs Canada
* Which counselor has the highest conversions?
* Which lead source performs best?
* Which students are at risk?
* Which country should we prioritize?
* Show high-budget applicants targeting Canada

Instead of relying on keyword matching, the Copilot interprets user intent and performs real calculations directly on CRM datasets to produce meaningful answers.

---

## Student AI Advisor

The Student AI Advisor functions as an intelligent admission consultant.

Unlike a traditional chatbot, it analyzes an individual student's academic profile alongside historical CRM admission trends.

The advisor provides:

* Personalized university recommendations
* Admission probability estimation
* Scholarship guidance
* Budget optimization suggestions
* Country comparisons
* University comparisons
* Visa planning guidance
* Application timeline recommendations
* Profile improvement strategies
* Academic gap analysis
* Historical admission reasoning
* Match score explanations

Every recommendation is backed by structured reasoning instead of generic AI-generated text.

---

## CRM Dataset Intelligence

The CRM has been designed to simulate real consultancy operations using large student datasets.

The AI performs calculations across thousands of records to generate:

* Average budgets
* Average CGPA
* Average IELTS
* Country-specific analytics
* Admission trends
* University popularity
* Scholarship statistics
* Conversion metrics
* Counselor performance
* Lead source analytics
* Student segmentation

This transforms the CRM into a conversational analytics platform capable of replacing many traditional reporting workflows.

---

## CSV Integration

* Bulk CSV imports
* Large dataset processing
* Dynamic student record generation
* Automatic dashboard updates
* Real-world CRM simulation
* Dataset-driven analytics

---

# Technology Stack

## Frontend

* React.js
* Vite
* JavaScript (ES6+)
* Context API
* Recharts

---

## Backend & Database

* Supabase
* PostgreSQL

---

## Artificial Intelligence

* Google Gemini API
* Prompt Engineering
* Context-Aware Conversational Interfaces
* AI Recommendation Engine
* CRM Reasoning Engine
* Natural Language Query Processing
* Intent Detection
* Historical Admission Analysis

---

## Deployment

* GitHub
* Vercel

---

# System Architecture

```text
React Frontend
       │
       ▼
Supabase API Layer
       │
       ▼
PostgreSQL Database
       │
       ▼
CRM Analytics Engine
       │
       ▼
Recommendation Engine
       │
       ▼
Student AI Advisor
       │
       ▼
Executive AI Copilot
```

---

# Project Structure

```text
global-degrees-crm/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── utils/
│   │
│   └── public/
│
├── backend/
│
├── analytics/
│
├── data/
│
└── README.md
```

---

# Business Use Case

International education consultancies manage thousands of student applications across multiple universities, countries, counselors, and admission cycles.

Traditional spreadsheet-based workflows often result in fragmented information, delayed reporting, and inefficient decision-making.

Global Degrees CRM addresses these challenges by providing:

* Centralized student management
* AI-assisted business intelligence
* Real-time CRM analytics
* Executive decision support
* Counselor productivity tracking
* Intelligent university recommendations
* Historical admission analysis
* Dataset-driven insights
* Conversational CRM analytics
* Scalable CRM operations

The platform demonstrates how artificial intelligence can transform traditional CRM systems into intelligent business decision platforms.

---

# Learning Outcomes

During the development of this project, the following concepts were implemented and explored:

* Full-stack application architecture
* React state management
* Supabase integration
* PostgreSQL data management
* CRM workflow design
* AI-powered recommendation systems
* Dataset-driven analytics
* Conversational AI interfaces
* Prompt engineering
* Natural language query processing
* Business intelligence dashboards
* Data visualization
* Production deployment using Vercel
* Git and GitHub workflows
* Large-scale CRM simulation
* Executive analytics generation

---

# Future Enhancements

* Authentication and role-based access control
* Automated email workflows
* Predictive admission scoring
* ML-based conversion prediction
* Advanced reporting exports
* Multi-branch CRM support
* Voice-enabled CRM assistant
* Fine-tuned recommendation models
* External university API integrations
* Real-time counselor notifications

---

# Repository

GitHub Repository:

https://github.com/KeshavKrishnaMIT/global-degrees-crm

---

# Author

**Keshav Krishna Singh**

B.Tech Student | Full-Stack Development | Artificial Intelligence | Data Analytics | CRM Systems

**LinkedIn:**
https://www.linkedin.com/in/keshav-krishna-singh
