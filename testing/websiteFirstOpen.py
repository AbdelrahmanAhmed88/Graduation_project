import webbrowser

VIN = "1HGCM82633A004352"
CAR_MODEL = "Model B"

def openFirstTimeScreen():
    print("Opening first time screen")
    url = f"http://localhost:3000/?v={VIN}&c={CAR_MODEL}"

    try:
        webbrowser.get("windows-default").open(url)
    except Exception as e:
        print(f"Error opening the website: {e}")

def main():
    openFirstTimeScreen()

if __name__ == "__main__":
    main()
