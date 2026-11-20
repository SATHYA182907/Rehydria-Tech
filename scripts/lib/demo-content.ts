/**
 * DEMO content for the platform preview: lesson files hosted under /public/demo and a
 * 25-question bank per course. Everything here is flagged `demo: true` in Firestore so it can be
 * found and replaced when Rehydria's official material arrives (admin: Lessons → links,
 * Questions → deactivate demo questions and add the real bank).
 */

export const demoLessonLinks = (courseId: string, level: number) => ({
  videoUrl: `/demo/${courseId}-level-${level}-video.mp4`,
  pdfUrl: `/demo/${courseId}-level-${level}-notes.pdf`,
});

type Q = [text: string, a: string, b: string, c: string, d: string, correct: "a" | "b" | "c" | "d"];

export const DEMO_QUESTIONS: Record<string, Q[]> = {
  iot: [
    ["What does IoT stand for?", "Internet of Things", "Integration of Technology", "Input/Output Terminal", "Internet of Tools", "a"],
    ["Which component converts a physical quantity into an electrical signal?", "Actuator", "Sensor", "Gateway", "Router", "b"],
    ["Which component acts on the physical world, such as a motor or relay?", "Sensor", "Broker", "Actuator", "Antenna", "c"],
    ["Which microcontroller has built-in Wi-Fi and Bluetooth?", "ATmega328P", "ESP32", "8051", "PIC16F84", "b"],
    ["MQTT is based on which messaging pattern?", "Request/response", "Peer-to-peer file sharing", "Publish/subscribe", "Remote procedure calls only", "c"],
    ["In MQTT, which component receives messages and forwards them to subscribers?", "Broker", "Client", "Topic", "Payload", "a"],
    ["What is the resolution of the ESP32 ADC by default?", "8-bit", "10-bit", "12-bit", "16-bit", "c"],
    ["Which wireless technology is designed for long range at low power?", "LoRa", "HDMI", "USB", "Ethernet", "a"],
    ["What is telemetry in an IoT system?", "Firmware updates", "Periodic sensor readings sent upstream", "The device's power supply", "A type of actuator", "b"],
    ["Which MQTT QoS level guarantees delivery exactly once?", "QoS 0", "QoS 1", "QoS 2", "QoS 3", "c"],
    ["What does a gateway usually do?", "Measures temperature", "Bridges local devices to the internet", "Stores the firmware", "Drives a motor", "b"],
    ["Which protocol is simplest for an occasional data upload with request/response?", "HTTP", "SPI", "I2C", "UART", "a"],
    ["What does PWM help control?", "Wi-Fi channel", "Average power, e.g. LED brightness", "Analog-to-digital resolution", "Memory size", "b"],
    ["Which bus uses two wires, SDA and SCL?", "SPI", "I2C", "UART", "CAN", "b"],
    ["Why use a relay module with a microcontroller?", "To read analog values", "To switch loads that need more current than a GPIO pin supplies", "To add Wi-Fi", "To store data", "b"],
    ["Which of these is an example of an edge device?", "A cloud database", "A soil-moisture node in a field", "A web browser", "An email server", "b"],
    ["What secures data sent from a device to the cloud?", "TLS encryption", "Shorter topic names", "A larger antenna", "Higher CPU clock", "a"],
    ["Which is a good practice for device credentials?", "One shared password for all devices", "Unique credentials per device", "No credentials on a private network", "Store them in the topic name", "b"],
    ["A cloud dashboard is mainly used to:", "Flash firmware", "Visualise readings and trigger alerts", "Power the sensors", "Replace the microcontroller", "b"],
    ["Which unit is commonly used to report relative humidity?", "Volts", "Percent (%)", "Hertz", "Ohms", "b"],
    ["What happens in the 'Process' stage of the IoT pipeline?", "Data is stored in the cloud", "The microcontroller reads signals and applies logic", "Sensors are manufactured", "The user logs in", "b"],
    ["Which topic name follows a sensible MQTT hierarchy?", "farm/field1/moisture", "moisture farm field1", "FIELD#1@MOISTURE", "/ / /", "a"],
    ["What should firmware do if the Wi-Fi connection drops?", "Stop permanently", "Reconnect automatically", "Erase its memory", "Increase PWM", "b"],
    ["What is the first step when planning an IoT capstone project?", "Buy the most expensive board", "Identify the problem and the data flow", "Write the final report", "Design the logo", "b"],
    ["Which document best shows how the components are wired?", "Circuit diagram", "Invoice", "Privacy policy", "Topic list", "a"],
  ],
  arduino: [
    ["Which microcontroller is used on the Arduino Uno?", "ESP32", "ATmega328P", "STM32F103", "RP2040", "b"],
    ["Which function runs once when an Arduino sketch starts?", "loop()", "setup()", "main()", "start()", "b"],
    ["Which function runs repeatedly after setup?", "repeat()", "loop()", "run()", "while()", "b"],
    ["What is the clock speed of the Arduino Uno?", "8 MHz", "16 MHz", "48 MHz", "240 MHz", "b"],
    ["How many analog input pins does the Uno have?", "4", "6", "8", "14", "b"],
    ["What range does analogRead() return on the Uno?", "0 to 255", "0 to 1023", "0 to 4095", "-512 to 511", "b"],
    ["What range does analogWrite() accept?", "0 to 255", "0 to 1023", "0 to 100", "0 to 5", "a"],
    ["Which pins on the Uno support analogWrite (PWM)?", "All pins", "Pins marked with ~", "Only A0 to A5", "Only pin 13", "b"],
    ["Which call configures a pin as an output?", "pinMode(pin, OUTPUT)", "digitalWrite(pin, OUTPUT)", "setPin(pin, 1)", "output(pin)", "a"],
    ["What does digitalWrite(pin, HIGH) do on a 5 V Uno?", "Sets the pin to about 0 V", "Sets the pin to about 5 V", "Reads the pin", "Enables PWM", "b"],
    ["Why use INPUT_PULLUP with a push button?", "To increase brightness", "So the input is never left floating", "To enable Wi-Fi", "To speed up the clock", "b"],
    ["Which resistor value is typical in series with an LED on 5 V?", "220 ohm", "10 ohm", "1 megaohm", "No resistor is needed", "a"],
    ["Which library is used to position a hobby servo?", "Wire", "Servo", "SPI", "EEPROM", "b"],
    ["What is the usual angle range of a hobby servo?", "0 to 90 degrees", "0 to 180 degrees", "0 to 360 degrees continuous", "-45 to 45 degrees", "b"],
    ["Which sensor measures distance with sound pulses?", "DHT11", "HC-SR04", "LDR", "PIR", "b"],
    ["Which sensor detects human motion by infrared?", "PIR", "LM35", "MQ-2", "HC-05", "a"],
    ["What starts serial communication at 9600 baud?", "Serial.begin(9600)", "Serial.print(9600)", "Serial.start(9600)", "begin.Serial(9600)", "a"],
    ["Which two wires does I2C use?", "MISO and MOSI", "SDA and SCL", "TX and RX", "VCC and GND", "b"],
    ["Compared to I2C, SPI is generally:", "Slower and uses fewer wires", "Faster and uses separate select lines", "Wireless", "Only for displays", "b"],
    ["Why use a motor driver such as the L298N?", "To read sensors", "Because I/O pins cannot supply motor current", "To add Bluetooth", "To store sketches", "b"],
    ["What does delay(1000) do?", "Waits 1 second", "Waits 1000 seconds", "Waits 1 millisecond", "Restarts the board", "a"],
    ["Why prefer millis() over long delay() calls?", "It uses less memory", "The sketch stays responsive while timing", "It increases accuracy of analogRead", "It is required for PWM", "b"],
    ["Which built-in constant refers to the on-board LED pin?", "LED_PIN", "LED_BUILTIN", "BOARD_LED", "PIN_LED13", "b"],
    ["What does an LDR measure?", "Light intensity", "Temperature", "Distance", "Humidity", "a"],
    ["Which practice helps when debugging a project?", "Wire everything before testing anything", "Test one module at a time", "Avoid Serial output", "Skip comments", "b"],
  ],
};
