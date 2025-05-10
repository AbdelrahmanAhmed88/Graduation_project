import webbrowser

VIN = "5YJ3E1EA7HF000314"
CAR_MODEL = "Model A"

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
