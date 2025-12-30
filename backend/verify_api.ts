
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function verifyApi() {
  try {
    // 1. Login
    console.log('Logging in...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123'
    });
    const token = loginRes.data.access_token;
    console.log('✅ Login successful');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Get Projects
    console.log('Fetching projects...');
    const projectsRes = await axios.get(`${BASE_URL}/projects`, { headers });
    const projects = projectsRes.data;
    console.log(`✅ Found ${projects.length} projects`);
    
    if (projects.length === 0) {
      console.log('⚠️ No projects found. Seed might have failed.');
      return;
    }
    
    const projectId = projects[0].id;
    console.log(`Using Project ID: ${projectId}`);

    // 3. Get Sprints
    console.log('Fetching sprints...');
    const sprintsRes = await axios.get(`${BASE_URL}/sprints`, { 
      headers,
      params: { projectId }
    });
    const sprints = sprintsRes.data;
    console.log(`✅ Found ${sprints.length} sprints`);
    console.log('Sprints:', JSON.stringify(sprints, null, 2));

    if (sprints.length === 0) {
        console.log('⚠️ No sprints found.');
        return;
    }

    const activeSprint = sprints.find((s: any) => s.status === 'active') || sprints[0];
    console.log(`Using Sprint ID: ${activeSprint.id} (Status: ${activeSprint.status})`);

    // 4. Get Tasks
    console.log('Fetching tasks...');
    const tasksRes = await axios.get(`${BASE_URL}/tasks`, {
      headers,
      params: { sprintId: activeSprint.id }
    });
    const tasks = tasksRes.data;
    console.log(`✅ Found ${tasks.length} tasks`);
    console.log('Tasks:', JSON.stringify(tasks, null, 2));

    if (tasks.length === 0) {
        console.log('⚠️ No tasks found for this sprint.');
    } else {
        // Check status
        const statuses = tasks.map((t: any) => t.status);
        console.log('Task Statuses:', statuses);
    }

    // 5. Get Backlog Items
    console.log('Fetching backlog items...');
    const backlogRes = await axios.get(`${BASE_URL}/backlog`, {
      headers,
      params: { projectId }
    });
    const backlog = backlogRes.data;
    console.log(`✅ Found ${backlog.length} backlog items`);
    console.log('Backlog:', JSON.stringify(backlog, null, 2));

  } catch (error: any) {
    console.error('❌ API Verification Failed:', error.message);
    if (error.response) {
      console.error('Response Data:', error.response.data);
    }
  }
}

verifyApi();
