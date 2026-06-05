const express = require('express');
const cors = require('cors');
const supabase = require('./supabaseClient');

const app = express();

app.use(cors());
app.use(express.json());

async function getAllStudents() {

    let allStudents = []
    let start = 0
    const batchSize = 1000

    while (true) {

        const { data, error } =
            await supabase
                .from('students')
                .select('*')
                .range(
                    start,
                    start + batchSize - 1
                )

        if (error) {
            throw error
        }

        if (!data.length) {
            break
        }

        allStudents.push(...data)

        start += batchSize

        if (data.length < batchSize) {
            break
        }
    }

    return allStudents
    console.log(
    'Students Loaded:',
    allStudents.length
)
}

app.get('/', (req, res) => {
    res.send('Global Degrees Backend Running');
});

app.get('/test', async (req, res) => {

    try {

        const data = await getAllStudents();

        res.json({
            fetchedRows: data.length,
            first: data[0]
        });

    } catch (err) {
        res.status(500).json(err);
    }

});

app.get('/students', async (req, res) => {

    try {

        const data = await getAllStudents();

        res.json(data);

    } catch (err) {

        res.status(500).json(err);

    }

});

app.get('/analytics', async (req, res) => {

    try {

        const data = await getAllStudents()

        const total = data.length

        const converted =
            data.filter(
                s => s.status === 'Converted'
            ).length

        const dropped =
            data.filter(
                s => s.status === 'Dropped'
            ).length

        const active =
            data.filter(
                s => s.status === 'Active'
            ).length

        const avgCGPA =
            data.reduce(
                (sum, s) => sum + Number(s.cgpa || 0),
                0
            ) / total

        const avgIELTS =
            data.reduce(
                (sum, s) => sum + Number(s.ielts_score || 0),
                0
            ) / total

        const avgLeadScore =
            data.reduce(
                (sum, s) => sum + Number(s.lead_score || 0),
                0
            ) / total

        const avgEnrollmentProbability =
            data.reduce(
                (sum, s) => sum + Number(s.enrollment_probability || 0),
                0
            ) / total

        const revenuePotential =
            data.reduce(
                (sum, s) => sum + Number(s.budget || 0),
                0
            )

        const enrollmentRate =
            (converted / total) * 100

        const highIntentLeads =
            data.filter(
                s => Number(s.lead_score) >= 80
            ).length

        const scholarshipEligible =
            data.filter(
                s =>
                    Number(s.cgpa) >= 8 &&
                    Number(s.ielts_score) >= 7
            ).length

        const countryCounts = {}
        const courseCounts = {}
        const sourceCounts = {}
        const riskCounts = {}
        const counselorStats = {}

        data.forEach(student => {

            const country =
                student.preferred_country

            const course =
                student.preferred_course

            const source =
                student.lead_source

            const risk =
                student.dropout_risk

            const counselor =
                student.assigned_counselor

            countryCounts[country] =
                (countryCounts[country] || 0) + 1

            courseCounts[course] =
                (courseCounts[course] || 0) + 1

            sourceCounts[source] =
                (sourceCounts[source] || 0) + 1

            riskCounts[risk] =
                (riskCounts[risk] || 0) + 1

            if (!counselorStats[counselor]) {

                counselorStats[counselor] = {
                    name: counselor,
                    students: 0,
                    converted: 0
                }
            }

            counselorStats[counselor].students++

            if (student.status === 'Converted') {
                counselorStats[counselor].converted++
            }

        })

        const topCountry =
            Object.entries(countryCounts)
                .sort((a, b) => b[1] - a[1])[0]?.[0]

        const topCourse =
            Object.entries(courseCounts)
                .sort((a, b) => b[1] - a[1])[0]?.[0]

        const topLeadSource =
            Object.entries(sourceCounts)
                .sort((a, b) => b[1] - a[1])[0]?.[0]

        const countryDistribution =
            Object.entries(countryCounts)
                .map(([name, value]) => ({
                    name,
                    value
                }))
                .sort((a, b) => b.value - a.value)

        const courseDistribution =
            Object.entries(courseCounts)
                .map(([name, value]) => ({
                    name,
                    value
                }))
                .sort((a, b) => b.value - a.value)

        const sourceDistribution =
            Object.entries(sourceCounts)
                .map(([name, value]) => ({
                    name,
                    value
                }))
                .sort((a, b) => b.value - a.value)

        const riskDistribution =
            Object.entries(riskCounts)
                .map(([name, value]) => ({
                    name,
                    value
                }))

        const counselorLeaderboard =
            Object.values(counselorStats)
                .map(c => ({
                    ...c,
                    rate:
                        (
                            c.converted /
                            c.students
                        ) * 100
                }))
                .sort(
                    (a, b) =>
                        b.rate - a.rate
                )
                const lowRiskStudents =
  data.filter(
    s => s.dropout_risk === 'Low'
  ).length

const mediumRiskStudents =
  data.filter(
    s => s.dropout_risk === 'Medium'
  ).length

const highRiskStudents =
  data.filter(
    s => s.dropout_risk === 'High'
  ).length

const avgAge =
  (
    data.reduce(
      (sum, s) =>
        sum + Number(s.age || 0),
      0
    ) / total
  ).toFixed(1)

const femalePercent =
  (
    data.filter(
      s => s.gender === 'Female'
    ).length /
    total *
    100
  ).toFixed(1)

const malePercent =
  (
    data.filter(
      s => s.gender === 'Male'
    ).length /
    total *
    100
  ).toFixed(1)

const scholarshipPercent =
  (
    data.filter(
      s =>
        s.scholarship_required ===
        'Yes'
    ).length /
    total *
    100
  ).toFixed(1)

const funnel = {
  contacted: 0,
  counseling: 0,
  documentation: 0,
  application: 0,
  visa: 0,
  enrolled: 0
}

data.forEach(student => {

  const stage =
    (student.current_stage || '')
      .toLowerCase()

  if (stage.includes('contact'))
    funnel.contacted++

  else if (
    stage.includes('counsel')
  )
    funnel.counseling++

  else if (
    stage.includes('document')
  )
    funnel.documentation++

  else if (
    stage.includes('application')
  )
    funnel.application++

  else if (
    stage.includes('visa')
  )
    funnel.visa++

  else if (
    stage.includes('enroll')
  )
    funnel.enrolled++
})

        res.json({
            total_students: total,
            active_students: active,
            converted_students: converted,
            dropped_students: dropped,

            avg_cgpa: avgCGPA.toFixed(2),
            avg_ielts: avgIELTS.toFixed(2),
            avg_lead_score: avgLeadScore.toFixed(1),

            enrollment_rate:
                enrollmentRate.toFixed(1),

            avg_enrollment_probability:
                avgEnrollmentProbability.toFixed(1),

            revenue_potential:
                revenuePotential,

            high_intent_leads:
                highIntentLeads,

            scholarship_eligible:
                scholarshipEligible,

            top_country:
                topCountry,

            top_course:
                topCourse,

            top_lead_source:
                topLeadSource,

            country_distribution:
                countryDistribution,

            course_distribution:
                courseDistribution,

            source_distribution:
                sourceDistribution,

            risk_distribution:
                riskDistribution,

            counselor_leaderboard:
                counselorLeaderboard,
                low_risk_students:
  lowRiskStudents,

medium_risk_students:
  mediumRiskStudents,

high_risk_students:
  highRiskStudents,

avg_age:
  avgAge,

female_percent:
  femalePercent,

male_percent:
  malePercent,

scholarship_percent:
  scholarshipPercent,

contacted:
  funnel.contacted,

counseling:
  funnel.counseling,

documentation:
  funnel.documentation,

application:
  funnel.application,

visa:
  funnel.visa,

enrolled:
  funnel.enrolled
        })

    } catch (err) {

        res.status(500).json(err)

    }

})

app.get('/hot-leads', async (req, res) => {

    try {

        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('lead_score', {
                ascending: false
            })
            .limit(20);

        if (error) {
            return res.status(500).json(error);
        }

        res.json(data);

    } catch (err) {
        res.status(500).json(err);
    }

});

app.get('/counselors', async (req, res) => {

    try {

        const data = await getAllStudents();

        const stats = {};

        data.forEach(student => {

            const counselor =
                student.assigned_counselor;

            if (!stats[counselor]) {

                stats[counselor] = {
                    total: 0,
                    converted: 0
                };

            }

            stats[counselor].total++;

            if (
                student.status === 'Converted'
            ) {
                stats[counselor].converted++;
            }

        });

        res.json(stats);

    } catch (err) {
        res.status(500).json(err);
    }

});

app.get('/scholarship/:id', async (req, res) => {

    try {

        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq(
                'student_id',
                req.params.id
            )
            .single();

        if (error) {
            return res.status(500).json(error);
        }

        let scholarship =
            'No Scholarship';

        if (
            Number(data.cgpa) >= 8 &&
            Number(data.ielts_score) >= 7
        ) {
            scholarship =
                'Merit Scholarship';
        }

        res.json({
            student: data.name,
            scholarship
        });

    } catch (err) {
        res.status(500).json(err);
    }

});

app.listen(5000, () => {
    console.log('Server running on port 5000');
});