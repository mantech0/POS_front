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
      alert('商品コードを入力してください');
      return;
    }
    
    try {
      const apiUrl = 'https://tech0-gen8-step4-pos-app-58.azurewebsites.net';
      console.log(`Requesting: ${apiUrl}/api/products/${code}`);
      const response = await fetch(`${apiUrl}/api/products/${code}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }).catch(error => {
        console.error('Fetch error:', error);
        throw new Error(`接続エラー: バックエンドサーバーが起動していないか、アクセスできません。(${error.message})`);
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          alert('商品が見つかりません');
        } else {
          const errorData = await response.json();
          alert(`エラーが発生しました: ${errorData.detail || response.statusText}`);
        }
        return;
      }
      
      const product = await response.json();
      console.log('Product data:', product);
      setCurrentProduct(product);
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'エラーが発生しました');
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
      const apiUrl = 'https://tech0-gen8-step4-pos-app-58.azurewebsites.net';
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
        const result = await response.json()
        alert(`合計金額: ${result.total_amount}円（税込）`)
        setCart([])
      } else {
        const errorData = await response.json()
        console.error('Purchase error:', errorData)
        alert('購入処理中にエラーが発生しました')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('購入処理中にエラーが発生しました')
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

      {currentProduct && (
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