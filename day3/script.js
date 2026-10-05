let notes=[
    {id:1, text:"Buy milk and bread", category: "personal"},
    {id:2, text:"Finish the Day 3 assignment", category: "study"},
    {id:3, text:"Email the project report to Grace", category: "work"},
    {id:4, text:"Revise javascript arrays", category: "study"},
    {id:5, text:"Call mum", category: "personal"}
];
function searchNotes(word) {
    const lowerWord=word.toLowerCase();
    return notes.filter(note=> note.text.toLowerCase().includes(lowerWord));
}
function longestNote() {
    if (notes.length===0) 
        return null;
        let longest =notes[0];
        for(let i=1; i<notes.length; i++){
            if (notes[i].text.length > longest.text.length) {
                longest=notes[i]
            }
        }
        return longest;
}
function countByCategory(params) {
    const counts={};
    for(let note of notes){
        if(counts[note.category]){
            counts[notes.category]++;
        }else{
            counts[notes.category]=1;
        }
    }
    return counts;
    
}
function getSummary(){
    const counts= countByCategory();
    const total=notes.length;
    const categoryParts=Object.entries(counts).map(([category, count])=>{
        return `${count} ${category}`;
    })
    const categoryString=categoryParts.join(",");
    return `${total} notes: ${categoryString}`;
}
function isDuplicate(text){
    const cleanText=text.trim().toLowerCase();
    return notes.some(note=>note.text.trim().toLowerCase()===cleanText);
}
function addNote(text, category) {
    if (text.length<1 || text.length>200) {
        console.log("Error: Note must be between 1 nad 200 characters.");
        return false;
    }
    const validCategories=["Personal", "work", "study"];
    if (!validCategories.includes(category)) {
        console.log("Error: Invalid category. Must be personal, work or study.");
        return false;
    }
    if (isDuplicate(text)) {
        console.log("Error: Note already exists");
        return false;
    }
    const newId=notes.length> 0 ? Math.max(...notes.map(n=>n.id))+1:1;
    notes.push({id:newId, text:text, category:category});
    return true;
}
//testing
console.log("Testing searchNotes");
console.log(searchNotes("milk"));
console.log(searchNotes("xyz"));
console.log("Testing the longetsNote");
console.log(longestNote());
let originalNotes=[...notes];
notes=[1];
console.log(longestNote());
notes=originalNotes;
console.log("Testing countByCategory");
console.log(countByCategory());
console.log("Testing getSummary");
console.log(getSummary());
console.log("Testing duplicate");
console.log(isDuplicate("Buy milk and bread"));
console.log(isDuplicate(" buy milk and bread"));
console.log("Testing addNote");
console.log(addNote("Go for a run", "personal"));
console.log(addNote("Go for run", "personal"));
console.log(addNote("Buy groceries", "shopping"));
console.log(addNote("a".repeat(201), "study"));
