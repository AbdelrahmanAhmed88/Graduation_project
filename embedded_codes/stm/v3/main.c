#include "math.h"
#include "STM32F401xB_xC.h"
#include "STM32F401xB_xC_GPIO.h"
#include "STM32F401xB_xC_EXTI.h"
#include "STM32F401xB_xC_RCC.h"
#include "STM32F401xB_xC_USART.h"
#include "STM32F401xB_xC_SPI.h"
#include "LCD.h"
#include "KeyPad.h"
#include "System.h"

// --- Defines ---
#define LED_GREEN           GPIO_PIN_1
#define LED_RED             GPIO_PIN_0
#define BTN_START_STOP      GPIO_PIN_8
#define IGNITION_PIN        GPIO_PIN_0
#define ALERT_PIN           GPIO_PIN_1

// --- Globals ---
extern UART_Config uart1Cfg;
extern UART_Config uart2Cfg;

// --- Prototypes ---
void gpio_init(void);
void delay_ms(int ms);
void init_system(void);
int handle_nfc_authentication(void);
char wait_for_user_confirmation(void);
void start_car(void);
void stop_car(void);

// --- GPIO Init ---
void gpio_init() {
    GPIO_PinConfig_t pinCfg;

    // BTN_START_STOP - Input Pull-Up
    pinCfg.GPIO_Mode = GPIO_Mode_Input;
    pinCfg.GPIO_PinNumber = BTN_START_STOP;
    pinCfg.GPIO_Pull_Type = GPIO_Pull_Type_PullUp;
    MCAL_GPIO_INIT(GPIOB, &pinCfg);

    // LED_RED
    pinCfg.GPIO_Mode = GPIO_Mode_Output;
    pinCfg.GPIO_Output_AF_type = GPIO_Output_AF_type_PushPull;
    pinCfg.GPIO_Output_Speed = GPIO_Output_Speed_MediumSpeed_25MHz;
    pinCfg.GPIO_PinNumber = LED_RED;
    pinCfg.GPIO_Pull_Type = GPIO_Pull_Type_NoPull;
    MCAL_GPIO_INIT(GPIOA, &pinCfg);

    // LED_GREEN
    pinCfg.GPIO_PinNumber = LED_GREEN;
    MCAL_GPIO_INIT(GPIOA, &pinCfg);

    // IGNITION_PIN
    pinCfg.GPIO_PinNumber = IGNITION_PIN;
    MCAL_GPIO_INIT(GPIOC, &pinCfg);

    // ALERT_PIN
    pinCfg.GPIO_PinNumber = ALERT_PIN;
    MCAL_GPIO_INIT(GPIOC, &pinCfg);
}

// --- Simple delay ---
void delay_ms(int x) {
    unsigned int i, j;
    for (i = 0; i < x; i++)
        for (j = 0; j < 255; j++);
}

// --- System Init ---
void init_system() {
    UART1_Init();
    UART2_Init();

    RCC_GPIOA_CLK_EN();
    RCC_GPIOB_CLK_EN();
    RCC_GPIOC_CLK_EN();

    gpio_init();
    LED_On(GPIOA, LED_GREEN);
    delay_ms(1000);
}

// --- NFC Authentication ---
int handle_nfc_authentication() {
    char receivedChar;
    int attempts = 0;

    while (attempts < 3) {
        LED_Off(GPIOA, LED_GREEN);
        LED_Off(GPIOA, LED_RED);

        MCAL_UART_ReceiveData(USART1, &receivedChar, enable, &uart1Cfg);
        delay_ms(100);

        if (receivedChar == 'O') {
            LED_On(GPIOA, LED_GREEN);
            return 1; // NFC passed
        } else {
            LED_On(GPIOA, LED_RED);
            attempts++;
            if (attempts == 3) {
                LED_On(GPIOA, LED_GREEN);
                LED_On(GPIOA, LED_RED);
            }
            delay_ms(700);
        }
    }

    return 0;
}

// --- Wait for 'U' from UART ---
char wait_for_user_confirmation() {
    char userFound = 'N';
    int retry = 0;

    while (retry < 3) {
        MCAL_UART_ReceiveData(USART1, &userFound, enable, &uart1Cfg);
        if (userFound == 'U') {
            return 'U';
        } else {
            retry++;
            if (retry == 3) {
                MCAL_GPIO_WritePin(GPIOC, ALERT_PIN, 1);
                return 'N';
            } else {
                MCAL_UART_SendString(USART1, "cface!", enable, &uart1Cfg);
                while (MCAL_GPIO_ReadPin(GPIOB, BTN_START_STOP) == 1);
            }
        }
    }
    return 'N';
}

// --- Start Car ---
void start_car() {
	while (MCAL_GPIO_ReadPin(GPIOB, BTN_START_STOP) == 1);
	delay_ms(20); // debounce

    MCAL_GPIO_WritePin(GPIOC, IGNITION_PIN, 1);
    LED_On(GPIOA, LED_RED);
    MCAL_UART_SendString(USART1, "S", enable, &uart1Cfg);
}

// --- Stop Car ---
void stop_car() {
	while (MCAL_GPIO_ReadPin(GPIOB, BTN_START_STOP) == 1);
	delay_ms(20); // debounce

    MCAL_GPIO_WritePin(GPIOC, IGNITION_PIN, 0);
    LED_Off(GPIOA, LED_GREEN);
    LED_Off(GPIOA, LED_RED);
    MCAL_UART_SendString(USART1, "E", enable, &uart1Cfg);
}

// --- Main ---
int main(void) {
    init_system();
    int carRunning = 0;

    while (1) {
        // Step 1: Authenticate via NFC
        int authPassed = handle_nfc_authentication();
        if (!authPassed) continue;

        // Step 2: Wait for button press
        while (MCAL_GPIO_ReadPin(GPIOB, BTN_START_STOP));
        delay_ms(20); // debounce
        while (!MCAL_GPIO_ReadPin(GPIOB, BTN_START_STOP)); // wait for release

        // Step 3: Confirm user
        char userStatus = wait_for_user_confirmation();
        if (userStatus != 'U') continue;

        // Step 4: Enter car control loop
        while (1) {
            if (MCAL_GPIO_ReadPin(GPIOB, BTN_START_STOP) == 0) {

                if (!carRunning) {
                    start_car();
                    carRunning = 1;
                } else {
                    stop_car();
                    carRunning = 0;
                    break;  // Exit loop, restart NFC authentication
                }
            }
        }
    }
}
