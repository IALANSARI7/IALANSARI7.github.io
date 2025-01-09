
async function fetchData(query, variables) {
    const token = localStorage.getItem('jwt');
    const response = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
    });
    const data = await response.json();
    console.log("data", data)
    return data.data;
}
async function getUserIdFromToken() {
    const query = `
    query GetCurrentUser {
        user {
            id
        }
    }
    `;
    try {
        const response = await fetchData(query, {});
        return response.user[0].id;
    } catch (error) {
        console.error('Error fetching user ID:', error);
        return null;
    }
}
const getTitleData = `
query GetTitleData($userId: Int) {
    event_user(where: { userId: { _eq: $userId }, eventId: { _eq: 20 } }) {
        level
    }
    user(where: { id: { _eq: $userId } }) {
        firstName
        lastName
        email
    }
}
`;
const getAuditData = `
query User($userId: Int) {
    user(where: { id: { _eq: $userId } }) {
        auditRatio
        totalDown
        totalUp
    }
}
`;
const getXpForProjects = `
query Transaction($userId: Int) {
    transaction(
        where: { eventId: { _eq: 20 }, userId: { _eq: $userId }, type: { _eq: "xp" }, object: { type: { _eq: "project" } }  }
        order_by: {createdAt: desc}
    ) {
        amount
        createdAt
        path
    }
}
`;

const getTotalXp = `query Transaction($userId: Int) {
    transaction(
        where: { eventId: { _eq: 20 }, userId: { _eq: $userId }, type: { _eq: "xp" } }
        order_by: {createdAt: desc}
    ) {
        amount
        createdAt
        path
    }
}
`

document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('jwt');
    window.location.href = 'index.html'; // Redirect to login page
});

async function loadProfile() {
    const userId = await getUserIdFromToken();

    if (!userId) {
        console.error('Failed to retrieve user ID');
        return;
    }

    try {
        const titleData = await fetchData(getTitleData, { userId });
        const auditData = await fetchData(getAuditData, { userId });
        const xpForProjects = await fetchData(getXpForProjects, { userId });
        const totalXp = await fetchData(getTotalXp, { userId });
        console.log("xpp", xpForProjects)

        // Display user info
        document.getElementById('userName').innerText = `Hello, ${titleData.user[0].firstName} ${titleData.user[0].lastName} `;
        document.getElementById('email').innerText = `Email: ${titleData.user[0].email}`
        document.getElementById('userLevel').innerText = `Level: ${titleData.event_user[0].level}`;
        document.getElementById('userXP').innerText = `XP: ${Math.round(totalXp.transaction.reduce((acc, tx) => acc + Math.round(tx.amount), 0) / 1000)} Kb`;
        document.getElementById('audit').innerText = `Audit Ratio: ${auditData.user[0].auditRatio.toFixed(1)}`;

        // Render graphs
        renderGraphs(xpForProjects, auditData);
    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

function renderGraphs(xpData, auditData) {
    // Sort the transactions by date
    xpData.transaction.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Get the maximum XP amount for scaling
    const maxXP = Math.max(...xpData.transaction.map(tx => tx.amount));

    // Set the width based on the number of transactions
    const barWidth = 100;
    const svgWidth = xpData.transaction.length * barWidth + 100; // Additional space for padding

    const xpGraph = document.getElementById('xpGraph');
    const svgXp = `
        <svg width="${svgWidth}" height="400" viewBox="0 0 ${svgWidth} 400" preserveAspectRatio="xMidYMid meet">
            <g transform="translate(50, 350)">
                ${xpData.transaction.map((tx, index) => {
                    const height = (tx.amount / maxXP) * 300; // Scale bar height
                    const x = index * barWidth + 20; // Position bars with spacing
                    const y = -height; // Invert y for correct bar direction
                    const moduleName = tx.path.split('/').pop(); // Get last part of path

                    return `
                        <g class="bar">
                            <rect x="${x}" y="${y}" width="80" height="0" fill="blue">
                                <animate attributeName="height" from="0" to="${height}" dur="0.8s" fill="freeze" />
                                <animate attributeName="y" from="0" to="${y}" dur="0.8s" fill="freeze" />
                            </rect>
                            <text x="${x + 40}" y="${-height - 10}" fill="black" font-size="12" text-anchor="middle">${tx.amount}</text>
                            <text x="${x + 40}" y="40" fill="black" font-size="12" text-anchor="middle">${moduleName}</text>
                        </g>`;
                }).join('')}
                <line x1="0" y1="0" x2="${svgWidth}" y2="0" stroke="black" />
            </g>
        </svg>`;
    xpGraph.innerHTML = svgXp;

    // Render Audit Ratio graph with rounded auditRatio
    const auditRatioGraph = document.getElementById('auditRatioGraph');
    const auditRatio = Math.round((auditData.user[0].auditRatio || 0) * 2) / 2;
    const circumference = 2 * Math.PI * 90; // Radius is 90

    const svgAudit = `
        <svg width="100%" height="200" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
            <circle cx="100" cy="100" r="90" stroke="lightgray" stroke-width="20" fill="none" />
            <circle cx="100" cy="100" r="90" stroke="green" stroke-width="20" fill="none" 
                    stroke-dasharray="${circumference}" 
                    stroke-dashoffset="${circumference - auditRatio * circumference}"
                    transform="rotate(-90 100 100)" />
            <text x="50%" y="50%" fill="black" font-size="20" text-anchor="middle" dy=".3em">
             ${auditData.user[0].auditRatio.toFixed(1)}
            </text>
        </svg>`;
    auditRatioGraph.innerHTML = svgAudit;
}

loadProfile();
