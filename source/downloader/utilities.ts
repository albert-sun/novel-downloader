// Formats paragraphs appropriately from string
export function formatParagraphs(input: string) {
    input = input.replaceAll(/\n{1,}/g, "\n"); // Remove repeating newlines
    input = input.replaceAll(/[ ]{2,}/g, " "); // Remove repeating whtiespace
    input = input.split("\n").map(line => line.trim()).join("\n"); // Remove whitespace before and after newlines
    input = input.trim(); // Remove leading and trailing whitespace

    return input;
}