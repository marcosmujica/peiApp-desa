import axios from 'axios';
import  "./constants"


export async function _setOTP(phone)
{

    try {

        //alert (_url_set_OTP + "/setOTP?pn=" + phone)
        const response = await axios.get(_url_set_OTP + "/setOTP?pn=" + phone.replace ("+","%2B"));
        //alert('Datos recibidos:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error al obtener datos:', error);
        return null;
      }
}


export async function _checkOTP(phone, otp)
{

    try {
        const response = await axios.get(_url_check_OTP + "/checkOTP?pn=" + phone.replace ("+","%2B") + "&otp=" + otp);
        //alert('Datos recibidos:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error al obtener datos:', error);
        return null;
      }
}