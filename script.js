// Initialize Icons
lucide.createIcons();

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sticky Header
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // 2. Mobile Menu Toggle
  const mobileMenuOpenBtn = document.getElementById('mobile-menu-open');
  const mobileMenuCloseBtn = document.getElementById('mobile-menu-close');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileOverlay = document.getElementById('mobile-overlay');
  
  function openMenu() {
    mobileMenu.classList.add('active');
    mobileOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu.classList.remove('active');
    mobileOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  mobileMenuOpenBtn.addEventListener('click', openMenu);
  mobileMenuCloseBtn.addEventListener('click', closeMenu);
  mobileOverlay.addEventListener('click', closeMenu);
  
  // Close menu when clicking a link inside it
  const mobileNavLinks = document.querySelectorAll('.mobile-nav a');
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // 3. Animated Counters (Intersection Observer)
  const counters = document.querySelectorAll('.counter');
  const speed = 200; // Lower is faster

  const animateCounters = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = +counter.getAttribute('data-target');
        
        const updateCount = () => {
          const count = +counter.innerText;
          const inc = target / speed;

          if (count < target) {
            counter.innerText = Math.ceil(count + inc);
            setTimeout(updateCount, 20);
          } else {
            counter.innerText = target;
          }
        };
        
        updateCount();
        observer.unobserve(counter); // Only animate once
      }
    });
  };

  const counterObserver = new IntersectionObserver(animateCounters, {
    threshold: 0.5
  });

  counters.forEach(counter => {
    counterObserver.observe(counter);
  });

  // 4. Smooth Scrolling for Anchor Links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        const headerOffset = header.offsetHeight;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // 5. Active Nav Link Highlighting based on scroll position
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.desktop-nav a[href^="#"]');
  
  window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (scrollY >= (sectionTop - header.offsetHeight - 50)) {
        current = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // 6. FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        // Close all other items
        faqItems.forEach(i => i.classList.remove('active'));
        // Toggle current item
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });

  // 7. Form Submission (Web3Forms)
  const setupForm = (formId, successId, errorId) => {
    const form = document.getElementById(formId);
    const successMsg = document.getElementById(successId);
    const errorMsg = document.getElementById(errorId);
    
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(form);
        const d = new Date();
        const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        formData.append("Date", formattedDate);
        const object = Object.fromEntries(formData);
        const json = JSON.stringify(object);
        
        successMsg.style.display = 'none';
        errorMsg.style.display = 'none';
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        import('./src/firebase.ts').then(async (firebaseModule) => {
          const { db } = firebaseModule;
          const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
          
          try {
            const msgDoc = {
              name: object.name,
              email: object.email,
              subject: object['User Subject'] || object.subject || 'No Subject',
              date: formattedDate,
              message: object.message,
              status: 'New',
              createdAt: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, 'messages'), msgDoc);
            
            await addDoc(collection(db, 'notifications'), {
              messageId: docRef.id,
              title: 'New Message',
              text: `You have a new message from ${object.name}`,
              read: false,
              createdAt: serverTimestamp()
            });
            
            successMsg.style.display = 'block';
            form.reset();
          } catch (error) {
            console.error(error);
            errorMsg.style.display = 'block';
            errorMsg.textContent = "Something went wrong!";
          } finally {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
          }
        });
      });
    }
  };

  setupForm('inquiry-form', 'success-message', 'error-message');
});

