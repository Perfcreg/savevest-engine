// app/Helpers/generateToken.ts

class GenerateTokenHelper {
    static generateToken(length: number): string {
      const characters = '0123456789';
      let token = '';
  
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters.charAt(randomIndex);
      }
  
      return token;
    }
  
    static generateAlphanumeric(length: number): string {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let alphanumeric = '';
  
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        alphanumeric += characters.charAt(randomIndex);
      }
  
      return alphanumeric;
    }
  }
  
  export default GenerateTokenHelper;
  