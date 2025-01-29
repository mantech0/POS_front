import { useState } from 'react'
import type { NextPage } from 'next'
import styles from '../styles/Home.module.css'
import BarcodeScanner from '../components/BarcodeScanner'

interface Product {
  PRD_ID: number
  CODE: string
  NAME: string
  PRICE: number
}

interface CartItem extends Product {
  quantity: number
}

const Home: NextPage = () => {
  const [code, setCode] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
  const [totalAmount, setTotalAmount] = useState<number | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  const handleCodeSubmit = async () => {
    if (!code) {
      if (!isScanning) {
        alert('商品がマスタ未登録です');
      }
      setCurrentProduct(null);
      return;
    }
    
    try {
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://tech0-gen8-step4-pos-app-58.azurewebsites.net'  // 本番環境
        : 'http://localhost:8000';  // ローカル環境
      console.log(`Requesting: ${apiUrl}/api/products/${code}`);
      const response = await fetch(`${apiUrl}/api/products/${code}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      if (!response || !response.ok) {
        if (response && response.status === 404) {
          if (!isScanning) {
            alert('商品がマスタ未登録です');
          }
          setCurrentProduct(null);
          return;
        } else {
          if (!isScanning) {
            alert('商品がマスタ未登録です');
          }
        }
        return;
      }
      
      const product = await response.json();
      console.log('Product data:', product);
      setCurrentProduct(product);
    } catch (error) {
      console.error('Error:', error);
      if (!isScanning) {
        alert('商品がマスタ未登録です');
      }
    }
  }

  const addToCart = () => {
    if (!currentProduct) return
    
    setCart(prev => {
      const existingItem = prev.find(item => item.CODE === currentProduct.CODE)
      if (existingItem) {
        return prev.map(item =>
          item.CODE === currentProduct.CODE
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...currentProduct, quantity: 1 }]
    })
    
    setCode('')
    setCurrentProduct(null)
  }

  const handlePurchase = async () => {
    try {
      const apiUrl = process.env.NODE_ENV === 'production'
        ? 'https://tech0-gen8-step4-pos-app-58.azurewebsites.net'  // 本番環境
        : 'http://localhost:8000';  // ローカル環境
      const response = await fetch(`${apiUrl}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: cart.map(item => ({
            prd_id: item.PRD_ID,
            code: item.CODE,
            name: item.NAME,
            price: item.PRICE,
            quantity: item.quantity
          }))
        })
      })

      if (response.ok) {
        const result = await response.json();
        const totalAmount = result.total_amount;
        const totalAmountExTax = result.total_amount_ex_tax;
        
        if (typeof totalAmount === 'number' && typeof totalAmountExTax === 'number') {
          alert(`合計金額（税込）: ${totalAmount}円\n合計金額（税抜）: ${totalAmountExTax}円`);
          setCart([]);
          setCurrentProduct(null);
        } else {
          alert('金額の計算に問題が発生しました');
        }
      } else {
        const errorData = await response.json();
        console.error('Purchase error:', errorData);
        alert('購入処理中にエラーが発生しました');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('購入処理中にエラーが発生しました');
    }
  }

  const handleCodeScanned = (scannedCode: string) => {
    setCode(scannedCode)
    setIsScanning(false)
    handleCodeSubmit()
  }

  return (
    <div className={styles.container}>
      <div className={styles.inputArea}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="商品コードを入力"
        />
        <button onClick={() => setIsScanning(!isScanning)}>
          {isScanning ? 'スキャンを停止' : 'スキャン（カメラ）'}
        </button>
        <button onClick={handleCodeSubmit}>商品コード 読み込み</button>
      </div>

      {isScanning && (
        <div className={styles.scannerArea}>
          <BarcodeScanner onCodeScanned={handleCodeScanned} />
        </div>
      )}

      {currentProduct && currentProduct.NAME !== '商品がマスタ未登録です' && (
        <div className={styles.productInfo}>
          <div>{currentProduct.CODE}</div>
          <div>{currentProduct.NAME}</div>
          <div>{currentProduct.PRICE}円</div>
          <button onClick={addToCart}>追加</button>
        </div>
      )}

      <div className={styles.cartArea}>
        <h3>購入リスト</h3>
        {cart.map((item, index) => (
          <div key={index} className={styles.cartItem}>
            <div>
              {item.NAME} x{item.quantity} {item.PRICE}円
            </div>
            <div>
              {item.PRICE * item.quantity}円
            </div>
          </div>
        ))}
      </div>

      <button 
        className={styles.purchaseButton}
        onClick={handlePurchase}
        disabled={cart.length === 0}
      >
        購入
      </button>
    </div>
  )
}

export default Home 