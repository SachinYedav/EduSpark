import { db, collection, getDocs } from "./firebase-config.js";

const coursesContainer = document.getElementById('courses-container');
const filterBtns = document.querySelectorAll('.filter-btn');

// Ek jagah jahan hum saare courses save karenge
let allCoursesData = [];

// --- 1. COURSES LOAD KARNA ---
async function loadCourses() {
    if (!coursesContainer) return;

    try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        
        // Data ko array mein save kar lo
        allCoursesData = [];
        querySnapshot.forEach((doc) => {
            // ID aur Data dono ko ek object mein rakho
            allCoursesData.push({ id: doc.id, ...doc.data() });
        });

        // Shuru mein saare courses dikhao
        renderCourses(allCoursesData);

    } catch (error) {
        console.error("Error fetching courses:", error);
        coursesContainer.innerHTML = "<p>Failed to load courses.</p>";
    }
}

// --- 2. HTML BANANA (Render Function) ---
// --- 2. HTML BANANA (Render Function) ---
function renderCourses(courses) {
    const coursesContainer = document.getElementById('courses-container');
    coursesContainer.innerHTML = ""; // Container saaf karo

    if(courses.length === 0) {
        coursesContainer.innerHTML = "<p style='text-align:center; width:100%;'>No courses found.</p>";
        return;
    }

    courses.forEach(course => {
        // --- IMAGE LOGIC FIX ---
        // Check karein ki image URL hai (http se shuru) ya CSS class (gradient-1)
        let imageStyle = "";
        let imageClass = "course-img"; // Default class

        if (course.image && course.image.startsWith('http')) {
            // Agar URL hai (Cloudinary), to background-image use karein
            imageStyle = `background-image: url('${course.image}'); background-size: cover; background-position: center;`;
        } else {
            // Agar purana data hai (gradient name), to class add karein
            imageClass += ` ${course.image || 'gradient-2'}`;
        }

        const cardHTML = `
            <div class="course-card" data-aos="fade-up">
                <div class="${imageClass}" style="${imageStyle}">
                    <span class="tag">${course.category}</span>
                </div>
                
                <div class="course-content">
                    <div class="course-meta">
                        <span><i class="ri-time-line"></i> ${course.duration || 'Live'}</span>
                        <span><i class="ri-star-fill" style="color:#f59e0b;"></i> ${course.rating || 'Verified'}</span>
                    </div>
                    
                    <h3>${course.title}</h3>
                    
                    <p style="font-size:0.9rem; color:#64748b; margin-bottom:15px;">
                        ${course.shortDescription 
                            ? course.shortDescription.substring(0, 60) + '...' 
                            : (course.description ? course.description.substring(0, 60) + '...' : 'Start learning today.')}
                    </p>
                    
                    <div class="course-footer">
                        <span class="price">₹${course.price}</span>
                        <a href="course-details.html?id=${course.id}" class="btn-text">View Details <i class="ri-arrow-right-line"></i></a>
                    </div>
                </div>
            </div>
        `;
        coursesContainer.innerHTML += cardHTML;
    });
}

// --- 3. FILTER LOGIC ---
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // 1. "Active" class badlo (Styling ke liye)
        document.querySelector('.filter-btn.active').classList.remove('active');
        btn.classList.add('active');

        // 2. Filter ki value uthao (HTML me data-filter attribute se)
        const filterValue = btn.getAttribute('data-filter');

        // 3. Data filter karo
        if (filterValue === 'All') {
            renderCourses(allCoursesData); // Sab dikhao
        } else {
            // Sirf wo courses dikhao jinki category match kare
            const filteredData = allCoursesData.filter(course => course.category === filterValue);
            renderCourses(filteredData);
        }
    });
});

// App start karo
loadCourses();