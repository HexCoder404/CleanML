import os
import time
from playwright.sync_api import sync_playwright

def generate_mock_csv():
    # Define mock data with nulls, duplicates, and category columns to trigger warnings
    data = [
        "Name,Age,Salary,Gender,Department,JoinDate",
        "Alice,25.0,50000.0,Female,Engineering,2021-01-15",
        "Bob,30.0,60000.0,Male,Sales,2020-05-20",
        "Charlie,,75000.0,Male,Engineering,2019-11-10",  # missing Age
        "David,40.0,,Male,Marketing,2018-08-05",        # missing Salary
        "Eve,22.0,45000.0,Female,,2022-03-01",         # missing Department
        "Bob,30.0,60000.0,Male,Sales,2020-05-20",       # duplicate row
        "Frank,35.0,80000.0,Male,Engineering,2017-12-15",
        "Grace,28.0,55000.0,Female,Marketing,2021-06-30",
        "Hannah,29.0,62000.0,Female,Sales,2020-10-12",
        "Ian,,90000.0,Male,Engineering,2016-04-25",     # missing Age
        "Alice,25.0,50000.0,Female,Engineering,2021-01-15"  # duplicate row
    ]
    csv_path = os.path.abspath("mock_dataset.csv")
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write("\n".join(data))
    print(f"Generated mock CSV at: {csv_path}")
    return csv_path

def capture_all():
    csv_path = generate_mock_csv()
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create high-DPI context for crisp screenshots
        context = browser.new_context(
            viewport={"width": 1280, "height": 850},
            device_scale_factor=2
        )
        page = context.new_page()
        
        # Add debugging logs
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"BROWSER ERROR: {err}"))
        page.on("requestfailed", lambda req: print(f"REQUEST FAILED: {req.url} - {req.failure}"))
        page.on("response", lambda res: print(f"RESPONSE ERROR: {res.url} - {res.status}") if res.status >= 400 else None)
        
        # Go to root to initialize localStorage
        print("Initializing session...")
        page.goto("http://localhost:3000/")
        page.evaluate("""() => {
            localStorage.setItem('cleanml_user', JSON.stringify({
                email: 'adityakakad10@gmail.com',
                name: 'Aditya',
                isLoggedIn: true,
                role: 'admin'
            }));
        }""")
        
        # Navigate to clean page (now logged in)
        print("Navigating to clean page...")
        page.goto("http://localhost:3000/clean")
        page.wait_for_selector('input[type="file"]', state="attached")
        
        # Upload file
        print("Uploading mock dataset...")
        page.set_input_files('input[type="file"]', csv_path)
        page.click('button:has-text("Generate Profile")')
        
        # Wait for profile to load
        print("Waiting for profile analysis...")
        page.wait_for_selector('text=Smart Preprocessing Suggestions', timeout=15000)
        
        # Hide scrollbars for clean UI look
        page.add_style_tag(content="""
            ::-webkit-scrollbar {
                display: none !important;
            }
        """)
        
        # 1. Capture Smart Suggestions Card
        print("Capturing Smart Suggestions...")
        suggestions_element = page.locator('section:has(h2:has-text("Smart Preprocessing Suggestions"))')
        suggestions_element.scroll_into_view_if_needed()
        time.sleep(0.5)  # wait for any animation to finish
        suggestions_element.screenshot(path="frontend/public/screenshot_smart_suggestions.png")
        
        # 2. Capture Before vs After Preview
        print("Capturing Before vs After Preview...")
        preview_element = page.locator('section:has(h2:has-text("Dataset Preview"))')
        preview_element.scroll_into_view_if_needed()
        time.sleep(0.5)
        preview_element.screenshot(path="frontend/public/screenshot_before_after.png")
        
        # 3. Trigger Auto Clean
        print("Applying Auto Clean...")
        page.click('button:has-text("Auto Clean Now")')
        page.wait_for_selector('text=Auto Clean Complete', timeout=15000)
        time.sleep(1.0)
        
        # Take viewport screenshot of the upper section showing stats and Auto Clean Complete banner
        print("Capturing Auto Clean banner/metrics...")
        # Scroll to top
        page.evaluate("window.scrollTo(0, 0)")
        time.sleep(0.5)
        # Capture a specific bounding box of stats + Auto Clean result
        # To make it beautiful, let's take a screenshot of the main section
        main_content = page.locator('main')
        main_content.screenshot(path="frontend/public/screenshot_auto_clean.png")
        
        # 4. Navigate to Visualizations and capture plots
        print("Navigating to Visualizations...")
        page.click('a[href="/visualize"]')
        page.wait_for_selector('text=Correlation Heatmap', timeout=15000)
        page.add_style_tag(content="""
            ::-webkit-scrollbar {
                display: none !important;
            }
        """)
        time.sleep(1.0)  # wait for charts to animate/render
        
        # Capture the correlation matrix section
        print("Capturing Visualizations...")
        viz_element = page.locator('section:has(h2:has-text("Correlation Heatmap"))')
        viz_element.scroll_into_view_if_needed()
        time.sleep(0.5)
        viz_element.screenshot(path="frontend/public/screenshot_visualizations.png")
        
        print("All screenshots successfully captured and saved in frontend/public/!")
        
        browser.close()

if __name__ == "__main__":
    capture_all()
